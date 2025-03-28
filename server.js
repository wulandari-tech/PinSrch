const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get('/api/search', async (req, res) => {
    const pinterestUrl = req.query.url;
    if (!pinterestUrl) return res.json({ error: "URL tidak boleh kosong" });

    try {
        const apiUrl = `https://pinterestdownloader.io/id/frontendService/DownloaderService?url=${encodeURIComponent(pinterestUrl)}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://pinterestdownloader.io/id'
        };

        const response = await axios.get(apiUrl, { headers });

        if (response.status === 200 && response.data) {
            res.json({
                url: pinterestUrl,
                title: response.data.title || "Pinterest Video & Photo",
                thumbnail: response.data.thumbnail,
                medias: response.data.medias || []
            });
        } else {
            res.json({ error: "Gagal mengambil data dari API" });
        }
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});