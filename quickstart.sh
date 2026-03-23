#!/bin/bash
# Quick Start Script for Emergency Route System

echo "🚑 Emergency Route System - Quick Start"
echo "========================================"
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

if ! command -v g++ &> /dev/null; then
    echo "❌ G++ compiler not found. Install from https://gcc.gnu.org/"
    exit 1
fi

if ! command -v make &> /dev/null; then
    echo "❌ Make not found. Install GNU Make."
    exit 1
fi

echo "✓ All prerequisites found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm --prefix backend install
echo "✓ Dependencies installed"
echo ""

# Build C++ engine
echo "🔨 Building C++ engine..."
cd core
g++ -std=c++17 -o route_engine main.cpp dijkstra.cpp
cd ..
echo "✓ C++ engine built"
echo ""

# Show instructions
echo "🎉 Setup complete!"
echo ""
echo "To run the application:"
echo ""
echo "1. Start Backend Server (Terminal 1):"
echo "   cd backend && npm start"
echo ""
echo "2. Start Frontend Server (Terminal 2):"
echo "   cd frontend && python -m http.server 8000"
echo ""
echo "3. Open Browser:"
echo "   http://localhost:8000"
echo ""
echo "Or use make commands:"
echo "   make backend   # Terminal 1"
echo "   make frontend  # Terminal 2"
echo ""
