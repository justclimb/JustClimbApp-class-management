# Class Management and Scheduling System

A React application built with DevExpress components for managing classes, schedules, students, and teachers.

## Features

- **Dashboard:** Overview of key statistics (total classes, students, teachers, upcoming classes)
- **Classes Management:** Create, view, update, and delete classes
- **Schedule Management:** Visual calendar for class scheduling with time slot management
- **Students Management:** Manage student information and class enrollment
- **Teachers Management:** Manage teacher information and class assignments

## Tech Stack

- React with TypeScript
- Material-UI for base components
- DevExpress React Components:
  - DataGrid for tables
  - Scheduler for calendar/scheduling
- React Router for navigation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd class-management
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Application Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Main application pages
- `src/services/` - API services and mock data
- `src/types/` - TypeScript type definitions

## Usage

### Dashboard
The dashboard displays key metrics and upcoming classes for quick overview.

### Classes
Manage class information including name, description, assigned teacher, and capacity.

### Schedule
Visual calendar to manage when classes are scheduled, with day, week, and month views.

### Students
Manage student information and enroll students in classes.

### Teachers
Manage teacher information and assign teachers to classes.

## Mock Data

The application uses mock data for demonstration purposes. In a production environment, you would replace the mock services with actual API calls.

## License

MIT
