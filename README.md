# Ward 29 DNCC Portal

A comprehensive digital platform for the residents of Ward 29, Dhaka North City Corporation (Mohammadpur). This portal facilitates citizen engagement, volunteer coordination, and efficient management of ward-level services.

## 🚀 Features

### Citizen Services
- **Digital Voter Slip**: Residents can search for their information using NID and Date of Birth to generate a digital voter slip with a QR code.
- **Complaint Management**: A dedicated system for residents to submit complaints or suggestions directly to the ward office.
- **Volunteer Registration**: Enthusiastic citizens can apply to join the ward's volunteer network.
- **Council Profile**: Detailed information about the Ward Councilor's vision, career, and social services.
- **Council Members**: Directory of officials and members serving the ward.

### Information & News
- **Latest News**: Real-time updates and announcements from the ward office.
- **Events Calendar**: Information about upcoming ward events, health camps, and meetings.
- **Photo Gallery**: Highlights of development works and community activities.

### Administrative Control Panel
- **Multi-level Access**: Role-based access (SuperAdmin, Admin) for managing different modules.
- **Voter Management**: Tools to import and manage resident data.
- **Advanced Search**: Powerful filtering for complaints and volunteer applications.
- **Content Management**: Easy-to-use interface to update news, events, and gallery images.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Motion (Animations), Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: SQLite (better-sqlite3) for reliable local storage.
- **Utilities**: QRCode.js for generating verifiable slips.

## 📦 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
1. Clone the repository or download the source.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a `.env` file in the root directory based on `.env.example`:
```env
PORICHOI_API_KEY=your_key_here
```

### Development
Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Production Build
Build the optimized frontend:
```bash
npm run build
```
Start the production server:
```bash
npm start
```

## 📄 License
This project is for internal use by Ward 29 DNCC. All rights reserved.
