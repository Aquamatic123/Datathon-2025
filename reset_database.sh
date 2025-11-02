#!/bin/bash
# Script to reset the database to empty state

cd "$(dirname "$0")"

echo "================================================"
echo "🗑️  Resetting Database"
echo "================================================"

# Backup current database
if [ -f "data/database.json" ]; then
    timestamp=$(date +%Y%m%d_%H%M%S)
    cp data/database.json "data/database.backup_${timestamp}.json"
    echo "✅ Backed up to: data/database.backup_${timestamp}.json"
fi

# Reset to empty database
cat > data/database.json << 'EOF'
{
  "DATA": {}
}
EOF

echo "✅ Database reset to empty state"

# Also reset history if it exists
if [ -f "data/history.json" ]; then
    cp data/history.json "data/history.backup_${timestamp}.json"
    cat > data/history.json << 'EOF'
{
  "history": []
}
EOF
    echo "✅ History reset to empty state"
fi

echo ""
echo "================================================"
echo "✅ Database successfully reset!"
echo "================================================"
echo ""
echo "Tip: You can restore from backup:"
echo "  cp data/database.backup_${timestamp}.json data/database.json"
echo ""
