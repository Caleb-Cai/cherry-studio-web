#!/bin/bash

# Cherry Studio Password Hash Generator
# This script generates bcrypt password hashes for user accounts

set -e

# Check if password is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <password>"
    echo "Example: $0 mypassword123"
    exit 1
fi

PASSWORD="$1"

echo "🔐 Generating bcrypt hash for password..."
echo ""

# Try different methods to generate bcrypt hash
if command -v node &> /dev/null; then
    # Use Node.js if available
    echo "Using Node.js to generate hash..."
    node -e "
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    bcrypt.hash('$PASSWORD', saltRounds, (err, hash) => {
        if (err) {
            console.error('Error:', err);
            process.exit(1);
        }
        console.log('Password:', '$PASSWORD');
        console.log('Bcrypt Hash:', hash);
        console.log('');
        console.log('SQL Insert Example:');
        console.log(\`INSERT INTO users (email, name, password) VALUES ('user@example.com', 'User Name', '\${hash}');\`);
    });
    "
elif command -v python3 &> /dev/null; then
    # Use Python if available
    echo "Using Python to generate hash..."
    python3 -c "
import bcrypt
import sys

password = '$PASSWORD'
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
hash_str = hashed.decode('utf-8')

print('Password:', password)
print('Bcrypt Hash:', hash_str)
print('')
print('SQL Insert Example:')
print(f\"INSERT INTO users (email, name, password) VALUES ('user@example.com', 'User Name', '{hash_str}');\")
"
else
    echo "❌ Error: Neither Node.js nor Python3 found."
    echo "Please install Node.js (with bcrypt package) or Python3 (with bcrypt package) to generate password hashes."
    echo ""
    echo "Node.js installation:"
    echo "  npm install bcrypt"
    echo ""
    echo "Python installation:"
    echo "  pip install bcrypt"
    exit 1
fi
