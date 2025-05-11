const rpc = require('discord-rpc')

const discord_client = new rpc.Client({ transport: 'ipc' });

const connectToDiscord = () => new Promise ((resolve) => {
    let attempts = 0
    console.log('Connecting to discord...');    
    let connectionInterval = setInterval(async () => {        
        attempts++
        
        discord_client.login({ clientId: '1273883076702900224' }).then(() => {
            clearInterval(connectionInterval);
            resolve(discord_client)
        }).catch((error) => {
            console.error(`Connection attempt failed: ${error.message}`);
        })
        if (attempts >= 6) {
            console.log('Max attempts reached, stopping connection attempts.');
            clearInterval(connectionInterval);
            resolve(false);
        }
    }, 5000)
})

export { connectToDiscord }