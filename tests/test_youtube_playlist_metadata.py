# tests/test_youtube_playlist_metadata.py
import unittest
from fastapi.testclient import TestClient
from server.main import app

class TestYouTubePlaylistMetadata(unittest.TestCase):
    def test_playlist_metadata_endpoint(self):
        with TestClient(app) as client:
            token = app.state.server.startup_token
            url = "https://www.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj"
            response = client.post("/api/metadata", json={"url": url}, headers={"X-Baynuman-Token": token})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("playlist_entries", data)
            entries = data["playlist_entries"]
            self.assertIsInstance(entries, list)
            self.assertGreater(len(entries), 0)
            print(f"\n[TEST SUCCESS] Extracted {len(entries)} items from playlist via /api/metadata endpoint!")

if __name__ == "__main__":
    unittest.main()
