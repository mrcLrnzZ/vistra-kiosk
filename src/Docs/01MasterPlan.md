# VISTRA – Master Planning Document (Phase 1)

## Project Information

**Project Name**

**VISTRA**

**Meaning**

**V**ital **S**igns **I**nformation **S**ystem for **T**reatment **R**ecords and **A**ppointments

---

# Purpose of this Document

This document serves as the **master planning context** for the VISTRA project.

Any AI assisting with this project should first understand this document before making recommendations. It defines the project's current scope, priorities, assumptions, and workflow.


---

# Project Overview

VISTRA is a **school health management system** designed to improve the efficiency of school clinic operations.

The project consists of several integrated components:

* Self-service Health Kiosk
* Student Health Records
* Treatment Records
* Appointment Management
* QR Code Synchronization
* Thermal Receipt Printing
* Student Mobile/Web Portal

The health kiosk serves as the primary data collection point where students can measure their vital signs.

---

# Current Development Phase

## Phase 1

Machine Workflow Planning

Current Objective:

Design the complete workflow of the kiosk before beginning software development.

Topics currently included:

* User journey
* Screen sequence
* Navigation flow
* Measurement process
* Save process
* Printing process
* User interaction

Topics intentionally postponed:

* Backend implementation
* Database
* Mobile application
* API design
* Arduino programming
* Sensor communication
* QR implementation
* Authentication
* Deployment

---

# Project Goals

The kiosk should be:

* Easy to understand
* Fast to operate
* Beginner-friendly
* Professional
* Accessible
* Reliable
* Modular
* Maintainable

The workflow should require minimal assistance from clinic personnel.

---

# Hardware Overview

The kiosk is expected to include:

* Display Monitor
* Computer
* Arduino Mega
* Camera (Gesture Navigation)
* Temperature Sensor
* Weight Sensor
* Height Sensor
* Heart Rate & SpO₂ Sensor
* Thermal Receipt Printer

---

# Software Stack

Frontend

* React

Backend

* Node.js
* Express.js

Hardware Controller

* Arduino Mega

Communication

* USB Serial Communication

---

# Current Machine Workflow

```text
WELCOME

↓

INSTRUCTIONS

↓

MEASUREMENT MODE

↓

HEIGHT

↓

WEIGHT

↓

TEMPERATURE

↓

HEART RATE

↓

OXYGEN SATURATION

↓

RESULTS REVIEW

↓

SAVE RECORDS?

├── YES
│
│   ↓
│
│ QR CODE
│
│ ↓
│
│ STUDENT SCANS QR
│
│ ↓
│
│ SAVE TO ACCOUNT
│
└───────────────┐
                │
                ▼

PRINT RECEIPT

↓

THANK YOU

↓

RETURN TO WELCOME
```

---

# Screen Details

## 1. Welcome Screen

Purpose

Idle screen while waiting for users.

Contents

* VISTRA Logo
* Welcome Message
* Start Measurement Button
* Gesture Navigation Indicator (optional)

Next Screen

Instructions

---

## 2. Instructions

Purpose

Explain how the kiosk works.

Example Instructions

* Follow the instructions on each screen.
* Stay still while measurements are taken.
* Collect your printed receipt.
* Scan the QR code if you choose to save your records.

Next Screen

Measurement Mode

---

## 3. Measurement Mode

Currently under discussion.

Possible Option A

Automatic Full Assessment

The kiosk automatically performs:

1. Height

2. Weight

3. Temperature

4. Heart Rate

5. Oxygen Saturation

Possible Option B

Manual Selection

Users choose which measurements to perform.

Current Recommendation

Automatic Full Assessment

Reason

* Faster
* Consistent
* Standardized
* Better clinic workflow

---

# Measurement Screen Standard

Every measurement screen should follow the same layout.

Workflow

Display Instructions

↓

Wait for User Position

↓

Capture Sensor Data

↓

Validate Measurement

↓

Display Result

↓

Proceed Automatically

Each screen should contain:

* Measurement title
* Sensor illustration
* Live reading
* Progress indicator
* Status message

---

# Measurement Order

Current proposed order

1. Height

2. Weight

3. Temperature

4. Heart Rate

5. Oxygen Saturation

---

# Results Review

Display all completed measurements.

Purpose

Allow users to verify the collected information before proceeding.

Displayed Data

* Height
* Weight
* Temperature
* Heart Rate
* SpO₂

Buttons

* Continue

(Optional)

* Repeat Measurement (future enhancement)

---

# Save Records

Question

Would you like to save your health records to your VISTRA account?

Options

YES

NO

---

## YES

Generate a temporary QR Code.

The student scans the QR Code using the VISTRA mobile application.

The application securely retrieves the current session's measurements.

After a successful save, continue to printing.

---

## NO

Skip the saving process.

Proceed directly to receipt printing.

---

# Receipt Printing

The kiosk always prints a receipt.

The receipt may include:

* Date
* Height
* Weight
* Temperature
* Heart Rate
* Oxygen Saturation

This ensures every user receives a physical copy regardless of whether the records were saved digitally.

---

# Thank You Screen

Display:

Measurement Complete

Please collect your printed receipt.

Thank you for using VISTRA.

After several seconds, automatically return to the Welcome Screen.

---

# Planning Principles

Future discussions should prioritize:

* User experience
* Workflow simplicity
* Standardized navigation
* Minimal user confusion
* Hardware feasibility
* Software maintainability
* Modular architecture
* Clinic efficiency

Whenever new features are proposed, evaluate them based on:

* Feasibility
* Technical complexity
* User experience
* Cost
* Time to implement
* Scalability
* Maintainability
* Risks
* Alternatives

---

# Current Decisions

✅ Project name finalized as **VISTRA**

✅ Health kiosk is the primary entry point for collecting vital signs.

✅ React will be used for the kiosk interface.

✅ Node.js + Express will handle backend communication.

✅ Arduino Mega will communicate with the sensors.

✅ USB Serial will connect the Arduino to the computer.

✅ Thermal receipt printing is included.

✅ Students may optionally save their records by scanning a QR code.

✅ A printed receipt is always generated, regardless of whether the records are saved.

---

# Next Planning Phase

After the machine workflow is approved, the next planning activities will be:

1. Screen-by-screen wireframes

2. User interface design

3. State machine design

4. Backend architecture

5. Arduino communication protocol

6. Database design

7. Mobile application workflow

8. QR synchronization workflow

9. Error handling

10. Complete software architecture
