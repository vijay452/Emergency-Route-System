.PHONY: build clean run install dev help setup backend frontend core backend-cpp build-backend-cpp deploy-check

# Compiler settings
CXX = g++
CXXFLAGS = -std=c++17 -Wall -O2
SRC_DIR = core
BUILD_DIR = core
EXECUTABLE = $(BUILD_DIR)/route_engine
CPP_BACKEND_BIN = $(BUILD_DIR)/cpp_backend_bin.exe
CPP_BACKEND_TARGET = cpp_backend_bin.exe
SOCKET_LIBS = -lws2_32

ifeq ($(OS),Windows_NT)
RM := del /Q
else
RM := rm -f
CPP_BACKEND_BIN = $(BUILD_DIR)/cpp_backend_bin
CPP_BACKEND_TARGET = cpp_backend_bin
SOCKET_LIBS =
endif

# Help command
help:
	@echo "🚑 Emergency Route System - Makefile Commands"
	@echo "=============================================="
	@echo "make setup          - Install all dependencies"
	@echo "make build          - Compile C++ engine"
	@echo "make build-backend-cpp - Compile native C++ backend server"
	@echo "make backend-cpp    - Run native C++ backend server"
	@echo "make run            - Run C++ interactive engine"
	@echo "make backend        - Start Node.js backend server"
	@echo "make frontend       - Start frontend (open browser)"
	@echo "make dev            - Start all services (development)"
	@echo "make clean          - Clean build artifacts"
	@echo "make install        - Install backend dependencies"
	@echo ""

# Setup: Install all dependencies
setup: install build
	@echo "✓ Setup complete!"

# Install Node.js dependencies
install:
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "✓ Dependencies installed"

# Build C++ engine
build:
	@echo "🔨 Building C++ engine..."
	cd $(SRC_DIR) && $(CXX) $(CXXFLAGS) -o route_engine main.cpp dijkstra.cpp
	@echo "✓ C++ engine built: $(EXECUTABLE)"

# Build native C++ backend server
build-backend-cpp:
	@echo "🔨 Building native C++ backend server..."
	cd $(SRC_DIR) && $(CXX) $(CXXFLAGS) -o $(CPP_BACKEND_TARGET) cpp_backend.cpp $(SOCKET_LIBS)
	@echo "✓ C++ backend built: $(CPP_BACKEND_BIN)"

# Run native C++ backend server
backend-cpp: build-backend-cpp
	@echo "🔌 Starting native C++ backend server..."
	cd $(SRC_DIR) && ./$(CPP_BACKEND_TARGET)

# Run C++ interactive engine
run: build
	@echo "🚀 Starting Emergency Route System - C++ Engine"
	@echo "================================================"
	$(EXECUTABLE)

# Start backend server
backend: install
	@echo "🔌 Starting Backend Server..."
	@echo "================================"
	cd backend && npm start

# Start frontend
frontend:
	@echo "🌐 Starting Frontend Server..."
	@echo "==============================="
	cd frontend && python -m http.server 8000

# Development mode (all services)
dev:
	@echo "🚑 Emergency Route System - Development Mode"
	@echo "=============================================="
	@echo ""
	@echo "To run the complete system, open multiple terminals:"
	@echo ""
	@echo "Terminal 1 - Backend:"
	@echo "  make backend"
	@echo ""
	@echo "Terminal 2 - Frontend:"
	@echo "  make frontend"
	@echo ""
	@echo "Then open your browser to: http://localhost:8000"
	@echo ""

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd $(SRC_DIR) && $(RM) route_engine route_engine.exe cpp_backend.exe cpp_backend_v2.exe cpp_backend_bin.exe cpp_backend_bin *.o
	@echo "✓ Clean complete"

deploy-check:
	@echo "✅ Running deploy checks (backend tests + C++ backend build)..."
	npm --prefix backend test
	npm run build:cpp:backend
	@echo "✓ Deploy checks passed"

# Display current configuration
show-config:
	@echo "Current Configuration:"
	@echo "====================="
	@echo "Backend URL: http://localhost:3000"
	@echo "Frontend URL: http://localhost:8000"
	@echo "C++ Engine: $(EXECUTABLE)"
	@echo ""