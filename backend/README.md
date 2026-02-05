# VendorHub Backend

This is the backend API for VendorHub, built with Express, Sequelize, and MySQL.

## Prerequisites

- Node.js (v16+)
- MySQL Server (running on localhost:3306)

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Copy `.env.example` to `.env` if you haven't already:
    ```bash
    cp .env.example .env
    ```
    Ensure the database credentials in `.env` match your MySQL setup:
    ```env
    DB_HOST=localhost
    DB_PORT=3306
    DB_NAME=vendorhub
    DB_USER=root
    DB_PASS=pass
    ```

3.  **Start Database**
    You must have a MySQL server running. If you have Docker installed, you can run:
    ```bash
    docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=vendorhub mysql:8
    ```
    *Note: If you are using a local MySQL installation (e.g., XAMPP, Workbench), make sure the service is started and the user/password usage matches the `.env` file.*

4.  **Seed Database**
    Populate the database with initial data:
    ```bash
    npm run seed
    ```

5.  **Run Server**
    Start the development server:
    ```bash
    npm run dev
    ```

## Troubleshooting

### `SequelizeConnectionRefusedError` / `ECONNREFUSED`
This error means the backend cannot connect to the database.
- **Check if MySQL is running.**
- Check if the host and port in `.env` are correct.
- If using Docker, ensure the container is running (`docker ps`).
