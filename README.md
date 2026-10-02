# 🎻 GigManager

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

GigManager is a comprehensive full-stack business operations platform tailored for independent professionals and freelancers to streamline their daily workflows. The application features a secure, centralized dashboard that allows users to efficiently manage client directories, schedule upcoming gigs, generate commercial quotes, and track invoices and overall earnings. 

Built with a focus on seamless usability and strict data integrity, GigManager replaces scattered administrative tools with a single, responsive system, ensuring secure access and reliable transaction handling from end to end.

---

## 🚀 Key Features

* **Dashboard & Analytics:** Get a real-time overview of active gigs, pending invoices, and total financial earnings.
* **Client Management:** A centralized directory for registering, updating, and organizing client contact details and locations.
* **Gig Scheduling:** End-to-end event management system to track performance dates, specific requirements, and gig statuses.
* **Financial Operations:** Automated creation, tracking, and management of commercial quotes and invoices.
* **Secure Authentication:** Authorized domain access using Google Sign-In via Firebase OAuth.

## 🛠️ Tech Stack

**Frontend**
* React (Vite)
* HTML5 / CSS3
* Axios (API Communication)

**Backend**
* Node.js / Express.js
* Joi (Server-side Data Validation)
* CORS Configuration

**Database**
* MySQL (Relational Schema)

**DevOps & Infrastructure**
* Linux Server Production Environment
* Nginx (Reverse Proxy)
* PM2 (Daemon Process Manager)
* SSL/HTTPS Certificates (Certbot)

---

## ⚙️ Local Development Setup

### Prerequisites
* Node.js (v16+)
* MySQL Server
* Firebase Project (for OAuth credentials)

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/GigManager-FullStack.git](https://github.com/yourusername/GigManager-FullStack.git)
cd GigManager-FullStack
```

////////////////////////////////////////////////////////////////////////////
1. Backend Setup
```bash
cd Gigmanager-backend
npm install
```
Create a .env file in the Gigmanager-backend directory:

```bash
PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=gigmanager_db
```

Start the backend server:

```bash
node server.js
```

3. Frontend Setup

```bash
cd ../Gigmanager-frontend
npm install
```

Create a .env file in the Gigmanager-frontend directory:

```bash
VITE_API_URL=http://localhost:3000/api/v1
```

Start the Vite development server:

```bash
npm run dev
```
