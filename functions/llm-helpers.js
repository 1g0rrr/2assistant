exports.llmPredict = llmPredict;
async function llmPredict(promptForPrediction) {
    const { OpenAI: LCOpenAI } = require("langchain/llms/openai");
    const llm = new LCOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.0,
        maxTokens: 1000,
        modelName: "gpt-4-0613",
    });

    let resultText = await llm.predict(promptForPrediction);
    resultText = resultText?.trim()?.replace(/^"(.*)"$/, "$1");

    return resultText;
}

exports.transcribeFile = transcribeFile;
async function transcribeFile(file, langXX) {
    const { OpenAI: MSOpenAI } = require("openai");

    const openai = new MSOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    let res = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: langXX ?? "auto",
    });

    let transcribedText = res.text;

    transcribedText = transcribedText.trim();
    return transcribedText;
}