const axios = require("axios");
const fs = require("fs");
const stream = require("stream");
const util = require("util");
const ffmpeg = require("fluent-ffmpeg");
const os = require("os");
const path = require("path");
const { ElevenLabsClient } = require("elevenlabs");
const { bucket } = require("./database/config");
require("dotenv").config();

// Environment Variables
const elevenLabsToken = process.env.ELEVENLABS_TOKEN;

console.log("TOKEN DE ELEVEN:", elevenLabsToken);

// Convert fs.write into Promise version to handle async/await
const pipeline = util.promisify(stream.pipeline);

const textToSpeech = async (textAPI) => {
  try {
    const elevenlabs = new ElevenLabsClient({
      apiKey: elevenLabsToken,
    });

    const audio = await elevenlabs.generate({
      voice: "Rachel",
      text: "" + textAPI,
      model_id: "eleven_multilingual_v2",
    });

    // Genera un nombre único para el archivo de audio
    const timestamp = new Date().getTime();
    const audioFilePath = path.join(os.tmpdir(), `voice_audio_${timestamp}.mp3`);
    const oggFilePath = path.join(os.tmpdir(), `voice_audio_${timestamp}.ogg`);

    // Guarda el audio en formato mp3
    await pipeline(audio, fs.createWriteStream(audioFilePath));
    console.log(`Audio guardado en: ${audioFilePath}`);

    // Convierte el audio de mp3 a ogg
    await convertMp3ToOgg(audioFilePath, oggFilePath);

    // Sube el archivo de audio a Firebase Storage sin guardar localmente
    console.log("Subiendo archivo de audio a Firebase Storage...");
    const fileName = `voice_audio_${timestamp}.ogg`;
    const fileUpload = bucket.file(fileName);
    const storageStream = fileUpload.createWriteStream({
      metadata: {
        contentType: "audio/ogg",
      },
    });
    const urlPromise = await new Promise((resolve, reject) => {
      storageStream.on("error", (err) => {
        console.error("Error al cargar el archivo en Firebase Storage:", err);
        reject(err);
      });

      storageStream.on("finish", async () => {
        console.log("Archivo de audio cargado en Firebase Storage con éxito.");
        // Obtiene la URL del archivo cargado
        const [url] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2900" });
        console.log("URL del archivo de audio:", url);
        resolve(url);
      });

      fs.createReadStream(oggFilePath).pipe(storageStream); // Piping the local file to Firebase Storage stream
    });
    console.log("urlPromise:", urlPromise);

    // Elimina los archivos temporales
    fs.unlinkSync(audioFilePath);
    fs.unlinkSync(oggFilePath);
    return urlPromise;
  } catch (error) {
    console.error("Error en la función textToSpeech:");
    throw error;
  }
};

// Convert mp3 to ogg
function convertMp3ToOgg(source, destination) {
  return new Promise((resolve, reject) => {
    ffmpeg(source).audioCodec("opus").output(destination).on("end", resolve).on("error", reject).run();
  });
}

module.exports = { textToSpeech };