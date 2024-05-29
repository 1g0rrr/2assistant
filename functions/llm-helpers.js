exports.llmPredict = llmPredict;
async function llmPredict(promptForPrediction) {
    const { OpenAI: LCOpenAI } = require("@langchain/openai");
    const llm = new LCOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.0,
        maxTokens: 1000,
        modelName: "gpt-4-0613",
    });

    let resultText = await llm.invoke(promptForPrediction);
    resultText = resultText?.trim()?.replace(/^"(.*)"$/, "$1");

    return resultText;
}

exports.llmImage = llmImage;
async function llmImage(promptText, photosUrls) {
    const { ChatOpenAI: LCChatOpenAI } = require("@langchain/openai");
    const { HumanMessage } = require("@langchain/core/messages");
    const llm = new LCChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.0,
        maxTokens: 1000,
        modelName: "gpt-4o",
    });

    promptText += "\n\n Answer the question above using all the images I took today. Do not name them individually. Provide only the necessary information for the request.";
    console.log("promptText", promptText)

    const imageUrlsObjects = photosUrls.map((url) => {
        return {
            type: "image_url",
            image_url: {
                "url": url,
                "detail": "low",
            },
        };
    });

    // console.log(imageUrlsObjects)
    const message = new HumanMessage({
        content: [
            {
                type: "text",
                text: promptText,
            },
            ...imageUrlsObjects,
        ],
    });
    let resultData = await llm.invoke([message]);
    let resultText = resultData?.content;

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