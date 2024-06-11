import express from "express";
import mongoAtlasConnect from "./db-utils/connectMongoose.js";
import studentRouter from "./routes/students_endpoint.js";
import mentorRouter from "./routes/mentors_endpoint.js";

const server = express();

server.use(express.json());

mongoAtlasConnect();

const port = "8100";

// Function to generate random 10 digit id
export function generateRandomId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(1)))[0]
    .toString()
    .padStart(10, "0")
    .slice(0, 10);
}

server.get("/", (req, res) => {
  const endpoints = [
    {
      path: "/students",
      method: "GET",
      description: "Get all students",
    },
    {
      path: "/students",
      method: "POST",
      description: "Add a new student",
    },
    {
      path: "/students/:studentId",
      method: "PUT",
      description: "Update a student",
    },
    {
      path: "/students/:studentId",
      method: "DELETE",
      description: "Delete a student",
    },
    {
      path: "/students/assign-mentor/:studentId",
      method: "PATCH",
      description: "Assign a mentor to a student",
    },
    {
      path: "/students/get-previous-mentor/:studentId",
      method: "GET",
      description: "Get the previous mentor of a student",
    },
    {
      path: "/mentors",
      method: "GET",
      description: "Get all mentors",
    },
    {
      path: "/mentors/:mentorId",
      method: "GET",
      description: "Get a given mentor",
    },
    {
      path: "/mentors",
      method: "POST",
      description: "Add a new mentor",
    },
    {
      path: "/mentors/:mentorId",
      method: "PUT",
      description: "Update a mentor",
    },
    {
      path: "/mentors/:mentorId",
      method: "DELETE",
      description: "Delete a mentor",
    },
    {
      path: "/mentors/assign-student/:mentorId",
      method: "PATCH",
      description: "Assign students to a mentor",
    },
  ];

  const endpointListHTML = endpoints
    .map(
      (endpoint) => `
<li style ="font-size:20px">
  <div style="display: flex; gap: 0.5rem; ">
    <span style="min-width: fit-content; font-weight:600;">${endpoint.path} (${endpoint.method}) - </span>
    <span>${endpoint.description}</span>
  </div>
</li>
`
    )
    .join("");

  const htmlResponse = `
    <h1 style="text-align: center">Student Mentor Management</h1>
    <p style ="font-size:20px">Try API endpoints:</p>
    <p style ="font-size:20px">Base URL: ${req.protocol}://${req.get(
    "host"
  )}/</p>
    <ol style="display: flex; flex-direction: column; gap: 0.5rem">
      ${endpointListHTML}
    </ol>
  `;

  res.send(htmlResponse);
});

server.use("/students", studentRouter);

server.use("/mentors", mentorRouter);

server.listen(port, () => {
  console.log(`${Date().toString()}: Server listening on port ${port}`);
});
