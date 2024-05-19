# task-manager

# Introduction

This task management system provides users with features that creates, updates, assigns, approves and manage tasks. The applications has the user management, task management and auth modules. This API was built with Node.js and Express.js with MongoDB/Mongoose for database. Additionally, socket io was used to provide real time update when changes are made to a task (completion/approval and others).

## Prerequisites

Before you can set up and run this application on your machine, you need the following installed:

- Node.js
- MongoDB either locally or remote
- Postman to access the documentation and test the API endpoints

## Setup

Follow these steps to set up and run the Task Management System on your machine:

1. **Install Dependencies**:

   After cloning the project, navigate to the project folder using your terminal and enter the command npm install to install all the required dependencies. The package.json file specifies all the needed dependecies to run the application.

2. **Run the Application**:

   - Enter the command npm run dev to start the application. A list of possible command scripts are specified in the package.json file as well.
   - If running the app for the first time (no super admin has been created), the app creates a super admin with the seeded data and logs the login credentials on your console.
   - When logged in, emit a socket.io event with the name "request-connection" with the jwt token as payload. This allows the system to track your coonnection and update the client real time.

## Usage

Once the application is up and running, you can interact with it using HTTP requests and socket connections. You can find the full documentation of available endpoints and examples here https://www.postman.com/goodness-chukwudi-public/workspace/niyo-test/collection/26100881-8075f923-d35c-4569-ba76-07b28d65b880?action=share&creator=26100881
The "Socket Connections" folder contains the socket.io connections while the "Task Manager" folder contains all the available HTTP requests
