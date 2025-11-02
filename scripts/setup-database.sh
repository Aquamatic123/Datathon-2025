#!/bin/bash
# setup-database.sh - Quick setup script for AWS RDS

echo "🚀 AWS RDS Database Setup"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    echo ""
    echo "Please enter your AWS RDS connection details:"
    echo ""
    read -p "RDS Endpoint (e.g., your-db.abc123.us-east-1.rds.amazonaws.com): " DB_HOST
    read -p "Database Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database Name [crm_dashboard]: " DB_NAME
    DB_NAME=${DB_NAME:-crm_dashboard}
    read -p "Database Username: " DB_USER
    read -s -p "Database Password: " DB_PASSWORD
    echo ""
    
    # Create .env.local file
    cat > .env.local << EOF
# AWS RDS PostgreSQL Connection
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_SSL=true

# Or use DATABASE_URL format:
# DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
EOF
    
    echo "✅ Created .env.local file"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

echo "📋 Next steps:"
echo "1. Run the database schema:"
echo "   psql -h <your-rds-endpoint> -U <username> -d crm_dashboard -f scripts/schema.sql"
echo ""
echo "   Or use AWS RDS Query Editor and paste scripts/schema.sql"
echo ""
echo "2. Migrate your data:"
echo "   npm run migrate"
echo ""
echo "3. Start the app:"
echo "   npm run dev"
echo ""
echo "📖 For detailed instructions, see SETUP.md or docs/AWS_RDS_SETUP.md"

