"""Character-level Transformer – Nosheen_Hina / Teacher Shneela.

Architecture extracted from backend/models/Teacher_Shneela.ipynb.
The class and hyper-parameter names are kept identical to the notebook so that
``checkpoint['model_state_dict']`` loads without key mismatches.

Usage
-----
    from app.ml.model import generate

    text = generate("the artificial intelligence", max_new_tokens=200)
"""

from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import Optional
from huggingface_hub import hf_hub_download

import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Hyper-parameters (must match the training run exactly)
# ---------------------------------------------------------------------------
VOCAB_SIZE: int = 1516
N_EMBED: int = 512
N_HEADS: int = 8
N_LAYERS: int = 6
BLOCK_SIZE: int = 256  # maximum context window
HEAD_SIZE: int = N_EMBED // N_HEADS

# Generation limits exposed to the API layer
MAX_NEW_TOKENS_DEFAULT: int = 200   # conservative default (latency-friendly)
MAX_NEW_TOKENS_LIMIT: int = 350     # hard ceiling per request

# Path to the checkpoint file (resolved relative to this file's location)
# _MODELS_DIR = Path(__file__).parent.parent.parent / "models"
# CHECKPOINT_PATH: Path = _MODELS_DIR / "nosheen_hina_best.pt"


_MODELS_DIR = Path(__file__).parent.parent.parent / "models"
LOCAL_CHECKPOINT_PATH = _MODELS_DIR / "nosheen_hina_best.pt"

def get_checkpoint_path() -> Path:
    if os.getenv("VERCEL"):
        return Path(
            hf_hub_download(
                repo_id="HashimUmar/nosheen-hina-model",
                filename="nosheen_hina_best.pt",
            )
        )
    return LOCAL_CHECKPOINT_PATH

# ---------------------------------------------------------------------------
# Architecture (verbatim from the notebook, variable names preserved)
# ---------------------------------------------------------------------------

class head(nn.Module):  # noqa: N801 – matches checkpoint keys
    def __init__(self, head_size: int) -> None:
        super().__init__()
        self.key   = nn.Linear(N_EMBED, head_size, bias=False)
        self.query = nn.Linear(N_EMBED, head_size, bias=False)
        self.value = nn.Linear(N_EMBED, head_size, bias=False)
        self.register_buffer("tril", torch.tril(torch.ones(BLOCK_SIZE, BLOCK_SIZE)))

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        _B, T, _C = x.shape
        k = self.key(x)
        q = self.query(x)
        V = self.value(x)
        wei = q @ k.transpose(-2, -1) * k.shape[-1] ** (-0.5)
        wei = wei.masked_fill(self.tril[:T, :T] == 0, float("-inf"))
        wei = F.softmax(wei, dim=-1)
        return wei @ V


class MultiHeadedAttention(nn.Module):  # noqa: N801
    def __init__(self, n_heads: int, head_size: int) -> None:
        super().__init__()
        self.heads = nn.ModuleList([head(head_size) for _ in range(n_heads)])
        self.proj  = nn.Linear(n_heads * head_size, N_EMBED)

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        eva = torch.cat([h(x) for h in self.heads], dim=-1)
        return self.proj(eva)


class feed_forward(nn.Module):  # noqa: N801
    def __init__(self, n_embed: int) -> None:
        super().__init__()
        self.linda = nn.Sequential(
            nn.Linear(N_HEADS * HEAD_SIZE, n_embed * 4),
            nn.ReLU(),
            nn.Linear(n_embed * 4, n_embed),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        return self.linda(x)


class block(nn.Module):  # noqa: N801
    def __init__(self, n_embed: int, n_heads: int) -> None:
        super().__init__()
        hs = n_embed // n_heads
        self.cbc = MultiHeadedAttention(n_heads, hs)
        self.fw  = feed_forward(n_embed)
        self.ln1 = nn.LayerNorm(n_embed)
        self.ln2 = nn.LayerNorm(n_embed)

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        x = x + self.cbc(self.ln1(x))
        x = x + self.fw(self.ln2(x))
        return x


class Nosheen_Hina(nn.Module):  # noqa: N801
    """Character-level decoder-only Transformer trained on educational text."""

    def __init__(self) -> None:
        super().__init__()
        self.token_embedding_table    = nn.Embedding(VOCAB_SIZE, N_EMBED)
        self.position_embedding_table = nn.Embedding(BLOCK_SIZE, N_EMBED)
        self.blocks = nn.Sequential(
            *[block(N_EMBED, n_heads=N_HEADS) for _ in range(N_LAYERS)]
        )
        self.ln_l   = nn.LayerNorm(N_EMBED)
        self.lm_head = nn.Linear(N_EMBED, VOCAB_SIZE)
        self.apply(self._init_weights)

    # Keep _init_weights – it must exist so the checkpoint loads cleanly even
    # though we never call it post-load; it's part of the module graph.
    def _init_weights(self, module: nn.Module) -> None:
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(  # type: ignore[override]
        self,
        idx: torch.Tensor,
        target: Optional[torch.Tensor] = None,
    ) -> tuple[torch.Tensor, Optional[torch.Tensor]]:
        _B, T = idx.shape
        # Use CPU-bound device tensor for positions (model is CPU in prod)
        tokens = self.token_embedding_table(idx)
        posi   = self.position_embedding_table(
            torch.arange(T, device=idx.device)
        )
        x = tokens + posi
        x = self.blocks(x)
        x = self.ln_l(x)
        logits = self.lm_head(x)
        loss = None
        if target is not None:
            _B, T, C = logits.shape
            logits = logits.view(_B * T, C)
            target = target.view(_B * T)
            loss   = F.cross_entropy(logits, target)
        return logits, loss

    def Generator(  # noqa: N802 – matches notebook name
        self,
        idx: torch.Tensor,
        max_token: int,
    ) -> torch.Tensor:
        for _ in range(max_token):
            # Crop to the last BLOCK_SIZE tokens so we never exceed context
            logits, _ = self(idx[:, -BLOCK_SIZE:])
            logits = logits[:, -1, :]           # (B, C)
            prob   = F.softmax(logits, dim=-1)
            ndx    = torch.multinomial(prob, num_samples=1)
            idx    = torch.cat((idx, ndx), dim=1)
        return idx


# ---------------------------------------------------------------------------
# Lazy singleton loader (thread-safe, loaded once per process)
# ---------------------------------------------------------------------------

class _ModelState:
    """Holds the lazily-loaded model and tokenizer mappings."""

    def __init__(self) -> None:
        self._lock:  threading.Lock = threading.Lock()
        self._model: Optional[Nosheen_Hina] = None
        self._stoi:  Optional[dict[str, int]] = None
        self._itos:  Optional[dict[int, str]] = None
        self._val_loss: Optional[float] = None
        self._load_error: Optional[str] = None

    
def _load(self) -> None:
    """Load checkpoint once. Call only while holding self._lock."""
    try:
        checkpoint_path = get_checkpoint_path()
        logger.info("Loading Nosheen_Hina checkpoint from %s", checkpoint_path)

        checkpoint = torch.load(
            checkpoint_path,
            map_location=torch.device("cpu"),
            weights_only=False,
        )

        self._stoi = checkpoint["stoi"]
        self._itos = checkpoint["itos"]
        self._val_loss = checkpoint.get("val_loss")

        model = Nosheen_Hina()
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()
        self._model = model

        logger.info(
            "Teacher Shneela is awake! val_loss=%s vocab=%d",
            f"{self._val_loss:.4f}" if self._val_loss is not None else "N/A",
            len(self._stoi),
        )

    except Exception as exc:
        self._load_error = f"Failed to download/load checkpoint: {exc}"
        logger.exception(self._load_error)

    def ensure_loaded(self) -> None:
        if self._model is not None or self._load_error is not None:
            return
        with self._lock:
            # Double-checked locking
            if self._model is None and self._load_error is None:
                self._load()

    @property
    def ready(self) -> bool:
        return self._model is not None

    @property
    def error(self) -> Optional[str]:
        return self._load_error

    @property
    def model(self) -> Nosheen_Hina:
        assert self._model is not None
        return self._model

    @property
    def stoi(self) -> dict[str, int]:
        assert self._stoi is not None
        return self._stoi

    @property
    def itos(self) -> dict[int, str]:
        assert self._itos is not None
        return self._itos


_state = _ModelState()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def warm_up() -> None:
    """Pre-load the model at application startup (optional but recommended).

    Call this from the FastAPI lifespan so the first real request is not slow.
    Loading a 248 MB file can take several seconds.
    """
    _state.ensure_loaded()


def generate(prompt: str, max_new_tokens: int = MAX_NEW_TOKENS_DEFAULT) -> str:
    """Generate text continuing from *prompt*.

    Parameters
    ----------
    prompt:
        Seed text from the user.  Unknown characters are silently skipped.
    max_new_tokens:
        Number of new characters to generate.  Clamped to
        ``[1, MAX_NEW_TOKENS_LIMIT]``.

    Returns
    -------
    str
        The full output string (prompt + generated continuation).

    Raises
    ------
    RuntimeError
        If the checkpoint could not be loaded.
    ValueError
        If the encoded prompt is empty (all characters unknown).
    """
    _state.ensure_loaded()

    if not _state.ready:
        raise RuntimeError(_state.error or "Model not loaded.")

    # Clamp generation length
    max_new_tokens = max(1, min(max_new_tokens, MAX_NEW_TOKENS_LIMIT))

    stoi = _state.stoi
    itos = _state.itos

    # Encode: skip characters not in the training vocabulary
    encoded = [stoi[c] for c in prompt if c in stoi]
    if not encoded:
        raise ValueError(
            "None of the characters in the prompt exist in the model vocabulary. "
            "Try a different prompt."
        )

    # Respect context window: keep only the last BLOCK_SIZE tokens as context
    if len(encoded) > BLOCK_SIZE:
        encoded = encoded[-BLOCK_SIZE:]

    ctx = torch.tensor([encoded], dtype=torch.long)  # (1, T)

    with torch.inference_mode():
        output_ids = _state.model.Generator(ctx, max_token=max_new_tokens)

    return "".join(itos[i] for i in output_ids[0].tolist())
