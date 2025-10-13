#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n=== Password Hash Generator ===\n');
console.log('This tool will generate a bcrypt hash for your password.');
console.log('Add the generated hash to your .env file as APP_PASSWORD_HASH\n');

rl.question('Enter the password you want to use: ', async (password) => {
    if (!password || password.trim().length === 0) {
        console.error('Error: Password cannot be empty');
        rl.close();
        process.exit(1);
    }

    if (password.length < 8) {
        console.warn('\n⚠️  Warning: Password is shorter than 8 characters. Consider using a stronger password.\n');
    }

    try {
        console.log('\nGenerating hash...');
        const hash = await bcrypt.hash(password, 10);

        console.log('\n✅ Hash generated successfully!\n');
        console.log('Add this line to your .env file:\n');
        console.log(`APP_PASSWORD_HASH=${hash}\n`);
        console.log('Also add (optional, for better security):');
        console.log(`SESSION_SECRET=${generateRandomSecret()}\n`);

    } catch (error) {
        console.error('Error generating hash:', error.message);
        process.exit(1);
    }

    rl.close();
});

function generateRandomSecret() {
    return require('crypto').randomBytes(32).toString('hex');
}
