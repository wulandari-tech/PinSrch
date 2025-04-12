const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Konfigurasi penyimpanan file unggahan (gambar)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Simpan gambar di folder 'uploads'
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Buat folder 'uploads' jika belum ada (opsional, tapi disarankan)
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
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
app.post('/api/news', upload.single('image'), (req, res) => {
    const { title, content, creator } = req.body;
    let imagePath = '';

    if (req.file) {
        imagePath = '/uploads/' + req.file.filename;
    }

    const newsItem = {
        title,
        content,
        creator,
        image: imagePath,
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
            res.redirect('/');
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

app.use('/uploads', express.static('uploads')); // Menyajikan file statis dari folder 'uploads'

// Endpoint untuk mengunduh file (Contoh Sederhana, tidak mengimplementasikan fitur unggahan file)
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename); // Asumsi file disimpan di 'uploads'

    // Cek apakah file ada
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }

        // Set header untuk memberitahu browser untuk mengunduh file
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/octet-stream'); // Tipe MIME default untuk unduhan

        // Kirim file
        fs.createReadStream(filePath).pipe(res);
    });
});


app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});