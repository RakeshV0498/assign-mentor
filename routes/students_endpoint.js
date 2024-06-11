import express from "express";
import { student, teacher } from "../db-utils/models.js";
import { generateRandomId } from "../index.js";

const studentRouter = express.Router();

// Route to get all students
studentRouter.get("/", async (req, res) => {
  try {
    // Fetch all student data from the database
    const data = await student.find({});

    // Send the fetched data as a response
    return res.send(data);
  } catch (error) {
    // Log any errors that occur during the database operation
    console.log(error);

    // Send an error response with appropriate status code and message
    return res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

studentRouter.get("/get-previous-mentor/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    // Find the student data based on the provided studentId
    const studentData = await student.findOne({ id: studentId });

    // If student data is not found, send a 404 error response
    if (!studentData) {
      return res
        .status(404)
        .send({ msg: `Student with ID ${studentId} not found` });
    }

    // Extract the previous teacher ID from the student data
    const teacherId = studentData.prevTeacherId;

    console.log(teacherId);

    // If a previous teacher ID exists, find and send the details of the previous teacher
    if (teacherId !== null) {
      const prevTeacher = await teacher.findOne({ id: teacherId });
      return res.send(prevTeacher);
    } else {
      // If no previous teacher ID exists, send a 400 error response
      return res
        .status(400)
        .send("No Teacher assigned to this student previously");
    }
  } catch (error) {
    // Log any errors that occur during the database operation
    console.log(error);

    // Send an error response with appropriate status code and message
    return res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

studentRouter.post("/", async (req, res) => {
  const { body } = req;

  // Check if the request body is empty or undefined
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).send({ msg: "Request body is missing or empty" });
  }

  try {
    // Create a new student document with generated random id
    const newStudent = await student.create({
      ...body,
      id: generateRandomId(),
    });

    // Send success message if student creation is successful
    res.send("Student added successfully");
  } catch (error) {
    // Log any errors that occur during student creation
    console.log(error);

    // Send an error response with appropriate status code and message
    res
      .status(500)
      .send({ msg: "Failed to add student. Please try again later" });
  }
});

studentRouter.put("/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const { body } = req;

  try {
    // Check if studentId is provided
    if (!studentId) {
      return res.status(400).send({ msg: "Student ID is required" });
    }

    // Check if the request body is empty or undefined
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).send({ msg: "Request body is missing or empty" });
    }

    const studentFound = await student.findOne({ id: studentId });

    if (!studentFound) {
      return res
        .status(404)
        .send({ msg: `No Student is found with this id ${studentId}` });
    }

    // Attempt to update the student data
    const updatedStudent = await student.updateOne(
      { id: studentId },
      { $set: { ...body, id: studentId } }
    );

    // Check if the update was successful
    if (updatedStudent) {
      return res.send("Student data updated successfully");
    } else {
      return res.status(400).send({ msg: "No student data updated" });
    }
  } catch (error) {
    // Log any errors that occur during the update operation
    console.log(error);

    // Send an error response with appropriate status code and message
    return res
      .status(500)
      .send({ msg: "Failed to update student data. Please try again later" });
  }
});

studentRouter.delete("/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    // Check if studentId is provided
    if (!studentId) {
      return res.status(400).send({ msg: "No student ID provided" });
    }

    // Find the student document with the provided studentId
    const studentData = await student.findOne({ id: studentId });

    // If student data exists, delete the student document
    if (studentData) {
      await student.deleteOne({ id: studentId });
      return res.send("Student removed successfully");
    } else {
      // If student data does not exist, send a 404 error response
      return res
        .status(404)
        .send({ msg: "No student found with the provided ID" });
    }
  } catch (error) {
    // Log any errors that occur during the deletion process
    console.log(error);

    // Send an error response with appropriate status code and message
    return res
      .status(500)
      .send({ msg: "Failed to remove student. Please try again later" });
  }
});

studentRouter.patch("/assign-mentor/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const { mentorId } = req.body;

  // Check if mentorId is provided
  if (!mentorId) {
    return res.status(400).send({ msg: "Please enter mentor ID to proceed" });
  }

  try {
    // Find the student data based on the provided studentId
    const studentData = await student.findOne({ id: studentId });

    // If no student is found with the provided ID, send a 404 error response
    if (!studentData) {
      return res
        .status(404)
        .send({ msg: `Student with ID ${studentId} not found` });
    }

    // Retrieve the current teacher ID from student data
    const currTeacherId = studentData.currentTeacherId;

    // Check if the student is already assigned to the specified mentor
    const { students } = await teacher.findOne({ id: mentorId });
    if (students.includes(studentId)) {
      return res
        .status(404)
        .send({ msg: "Student already assigned to this mentor" });
    }

    // Update student data with new teacher ID if the student has no current teacher
    if (currTeacherId === null || currTeacherId === undefined) {
      await student.updateOne(
        { id: studentId },
        { $set: { currentTeacherId: mentorId } }
      );
      await teacher.updateOne(
        { id: mentorId },
        { $push: { students: studentId } }
      );
      return res.send(`${mentorId} assigned to this student`);
    } else if (currTeacherId !== mentorId) {
      // Update student data with new current and previous teacher IDs
      await student.updateOne(
        { id: studentId },
        {
          $set: {
            prevTeacherId: currTeacherId,
            currentTeacherId: mentorId,
          },
        }
      );

      // Retrieve the previous teacher ID from student data
      const { prevTeacherId } = await student.findOne({ id: studentId });

      if (prevTeacherId === null || prevTeacherId === undefined) {
        await teacher.updateOne(
          { id: mentorId },
          { $push: { students: studentId } }
        );
      } else {
        // Update mentor's student list and remove student from the previous teacher's list
        await teacher.updateOne(
          { id: mentorId },
          { $push: { students: studentId } }
        );
        await teacher.updateOne(
          { id: prevTeacherId },
          { $pull: { students: studentId } }
        );
      }

      return res.send(
        `${mentorId} is currently assigned to this student and the previous mentor is ${prevTeacherId}`
      );
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Send a generic error response
    return res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

export default studentRouter;
