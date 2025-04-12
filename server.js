const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Konfigurasi penyimpanan file unggahan (gambar dan file lainnya)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Gunakan folder 'uploads' untuk gambar, dan 'uploads/files' untuk file lainnya
        const uploadPath = file.mimetype.startsWith('image/') ? 'uploads/' : 'uploads/files/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Membuat folder jika belum ada
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Buat folder 'uploads' dan 'uploads/files' jika belum ada (opsional, tapi disarankan)
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('uploads/files')) {
    fs.mkdirSync('uploads/files');
}

// Endpoint untuk menampilkan halaman utama (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint untuk menampilkan halaman admin (admin.html)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Endpoint untuk menerima postingan berita dari admin.html
app.post('/api/news', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), (req, res) => {
    const { title, content, creator } = req.body;
    let imagePath = '';
    let filePath = '';

    if (req.files && req.files.image && req.files.image.length > 0) {
        imagePath = '/uploads/' + req.files.image[0].filename;
    }
    if (req.files && req.files.file && req.files.file.length > 0) {
        filePath = '/uploads/files/' + req.files.file[0].filename;
    }

    const newsItem = {
        title,
        content,
        creator,
        image: imagePath,
        file: filePath,  // Menyimpan path file yang diunggah
        date: new Date().toLocaleDateString()
    };

    fs.readFile('news.json', 'utf8', (err, data) => {
        let newsData = [];
        if (!err) {
            newsData = JSON.parse(data);
        }
        newsData.push(newsItem);

        fs.writeFile('news.json', JSON.stringify(newsData, null, 2), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error saving news.');
            }
            res.redirect('/admin'); // Redirect kembali ke admin setelah berhasil
        });
    });
});


// Endpoint untuk mengambil semua berita (untuk ditampilkan di index.html)
app.get('/api/news', (req, res) => {
    fs.readFile('news.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading news.');
        }
        const newsData = JSON.parse(data);
        res.json(newsData);
    });
});

// Endpoint untuk menghapus berita
app.delete('/api/news/:index', (req, res) => {
    const index = parseInt(req.params.index);

    fs.readFile('news.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading news.');
        }

        let newsData = JSON.parse(data);

        if (index >= 0 && index < newsData.length) {
            const deletedNews = newsData.splice(index, 1); // Menghapus item dari array
            fs.writeFile('news.json', JSON.stringify(newsData, null, 2), (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error deleting news.');
                }
                // Hapus file gambar/file terkait (opsional)
                if (deletedNews[0].image) {
                    fs.unlink(path.join(__dirname, deletedNews[0].image), (err) => {
                        if (err) console.error('Error deleting image:', err);
                    });
                }
                if (deletedNews[0].file) {
                    fs.unlink(path.join(__dirname, deletedNews[0].file), (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                }
                res.status(200).send('News deleted'); // Kirim status 200 OK
            });
        } else {
            res.status(404).send('News not found'); // Kirim status 404 Not Found
        }
    });
});


app.use('/uploads', express.static('uploads'));
app.use('/uploads/files', express.static('uploads/files'));  // Melayani file yang diunggah di folder file.

// Endpoint untuk mengunduh file (Menggunakan path file dari data news)
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads/files', filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }

        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/octet-stream'); // Set type MIME default
        fs.createReadStream(filePath).pipe(res);
    });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
