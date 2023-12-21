const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const MAX_TRIES = 10;

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("Cliente pronto!");
});

client.on('message_reaction', async (reaction) => {
    if (reaction.id.fromMe && reaction.reaction !== '') {
        const options = {
            caption: "🤖: Aqui está o arquivo que você reagiu.",
            sendMediaAsDocument: false
        }
        try {
            const reactedMsg = await getReactedMsg(reaction.msgId._serialized, 1);
            
            if (reactedMsg && !reactedMsg.hasMedia) return;
            
            await reactedMsg.react("");
            const attachmentData = await reactedMsg.downloadMedia();

            if (!attachmentData) return;

            if (attachmentData.mimetype.includes('video')) {
                options.sendMediaAsDocument = true;

                attachmentData.filename = Date.now() + "." + attachmentData.mimetype.split('/')[1];
            }

            client.sendMessage(reaction.senderId, attachmentData, options);
        } catch (error) {
            console.log(error);
            client.sendMessage(reaction.senderId, "🤖: Desculpe, não consegui baixar o arquivo, tente novamente em breve.");
        }
    }
});

client.initialize();

/**
 * Retrieves the reacted message with the given message ID.
 * @param {string} msgId - The ID of the message to retrieve.
 * @param {number} tries - The number of tries made to retrieve the message.
 * @returns {Promise<WAWebJS.Message|null>} - A promise that resolves to a Message object, or null if the maximum number of tries has been reached.
 */
async function getReactedMsg(msgId, tries) {
    if (tries > MAX_TRIES) return null;

    try {
        const reactedMsg = await client.getMessageById(msgId);
        return reactedMsg;
    } catch (error) {
        console.log(`Não foi possível recuperar a mensagem reagida. Tentativa ${tries} de ${MAX_TRIES}.`);

        await new Promise(resolve => setTimeout(resolve, 100));

        return await getReactedMsg(msgId, ++tries);
    }
}