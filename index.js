const express = require("express");
const fs = require("fs").promises;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const app = express();
const path = require("path");
const port = 8000;

app.use(express.static(__dirname));
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).send("Перейдіть за посиланням http://localhost:8000/upload");
});

app.get("/upload", (req, res) => {
    const filePath = path.join(__dirname, "static/UploadForm.html");
    fs.access(filePath, fs.constants.F_OK)
        .then(() => res.sendFile(filePath))
        .catch(() => res.status(404).send("File not found."));
});

app.get("/notes", async (req, res) => {
    const filePath = path.join(__dirname, "notes.json");
    try {
        const notesData = await fs.readFile(filePath, "utf8");
        const notes = JSON.parse(notesData);
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
});

app.get("/notes/:noteName", async (req, res) => {
    const noteName = req.params.noteName;
    const filePath = path.join(__dirname, "notes.json");
    try {
        const notesData = await fs.readFile(filePath, "utf8");
        const notes = JSON.parse(notesData);
        const foundNote = notes.find((note) => note.note_name === noteName);
        if (foundNote) {
            res.status(200).send(foundNote.note_text.toString());
        } else {
            res.status(404).send("Нотатка не знайдена.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
});

app.post("/upload", upload.single("note"), async (req, res) => {
    const noteName = req.body.note_name;
    const noteText = req.body.note;
    try {
        const notesData = await fs.readFile("notes.json", "utf8");
        const notes = JSON.parse(notesData);
        const existingNote = notes.find((note) => note.note_name === noteName);

        if (existingNote) {
            res.status(400).send("Нотатка з таким іменем вже існує. Використовуйте інше ім'я.");
        } else {
            notes.push({ note_name: noteName, note_text: noteText });
            await fs.writeFile("notes.json", JSON.stringify(notes));
            res.status(201).send("Нотатка успішно завантажена.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
});

app.put("/notes/:noteName", async (req, res) => {
    const noteName = req.params.noteName;
    const filePath = path.join(__dirname, "notes.json");
    let requestBody = "";
    
    req.on("data", chunk => {
        requestBody += chunk;
    });

    req.on("end", async () => {
        try {
            const updatedNoteText = requestBody.toString();
            const notesData = await fs.readFile(filePath, "utf8");
            const notes = JSON.parse(notesData);
            const noteToUpdate = notes.find((note) => note.note_name === noteName);

            if (noteToUpdate) {
                noteToUpdate.note_text = updatedNoteText;
                await fs.writeFile(filePath, JSON.stringify(notes));
                res.status(200).send(`Нотатка успішно оновлена: ${noteToUpdate.note_text}`);
            } else {
                res.status(404).send("Нотатка не знайдена.");
            }
        } catch (error) {
            res.status(400).send("Неправильний запит тіла.");
        }
    });
});

app.delete("/notes/:noteName", async (req, res) => {
    const noteName = req.params.noteName;
    const filePath = path.join(__dirname, "notes.json");

    try {
        const notesData = await fs.readFile(filePath, "utf8");
        let notes = JSON.parse(notesData);
        const initialLength = notes.length;
        notes = notes.filter((note) => note.note_name !== noteName);

        if (notes.length < initialLength) {
            await fs.writeFile(filePath, JSON.stringify(notes));
            res.status(200).send("Нотатка успішно видалена.");
        } else {
            res.status(404).send("Нотатка не знайдена.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
});

app.listen(port, () => {
    console.log(`Сервер запущено за адресою http://localhost:${port}`);
});
