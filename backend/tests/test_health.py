def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI Learning Tutor API is running"}


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
