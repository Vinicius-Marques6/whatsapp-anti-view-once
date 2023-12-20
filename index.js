const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

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
        try {
            const reactedMsg = await client.getMessageById(reaction.msgId._serialized);
            if (reactedMsg.hasMedia) {
                const attachmentData = await reactedMsg.downloadMedia();

                if (attachmentData) {
                    client.sendMessage(reaction.senderId, attachmentData, {caption: "🤖: Aqui está o arquivo que você reagiu."});
                }
            }
        } catch (error) {
            console.log(error);
            client.sendMessage(reaction.senderId, "🤖: Desculpe, não consegui baixar o arquivo, tente novamente em breve.")
        }
    }
});

client.initialize();