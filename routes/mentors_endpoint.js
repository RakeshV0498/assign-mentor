import express from "express";
import { student, teacher } from "../db-utils/models.js";
import { generateRandomId } from "../index.js";

const mentorRouter = express.Router();

mentorRouter.get("/", async (req, res) => {
  try {
    // Retrieve all mentor data from the database
    const mentorData = await teacher.find({});

    // Send mentor data as a response
    return res.send(mentorData);
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Send a generic error response if MongoDB service is unavailable
    return res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

mentorRouter.get("/:mentorId", async (req, res) => {
  const { mentorId } = req.params;

  try {
    // Find the mentor data based on the provided mentorId
    const mentor = await teacher.findOne({ id: mentorId });

    // If no mentor is found with the provided ID, send a 404 error response
    if (!mentor) {
      return res
        .status(404)
        .send({ msg: `Mentor with ID ${mentorId} not found` });
    }

    // Retrieve the list of students assigned to the mentor
    const { students } = mentor;

    // If no students are assigned to the mentor, send a 404 error response
    if (!students || students.length === 0) {
      return res
        .status(404)
        .send({ msg: `No students assigned to this mentor ${mentorId}` });
    }

    // Retrieve detailed information about each student assigned to the mentor
    const studentData = await Promise.all(
      students.map(async (stuId) => await student.findOne({ id: stuId }))
    );

    // Send the detailed student data as a response
    res.send(studentData);
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Send a generic error response if MongoDB service is unavailable
    res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

mentorRouter.post("/", async (req, res) => {
  const { body } = req;

  try {
    // Check if the request body is empty
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).send({ msg: "Request body is empty" });
    }

    // Create a new mentor with the provided data and generate a random ID
    const newMentor = await teacher.create({
      ...body,
      id: generateRandomId(),
    });

    // Send success response after adding the mentor
    res.send(`Mentor added successfully`);
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Send a generic error response if MongoDB service is unavailable
    res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

mentorRouter.put("/:mentorId", async (req, res) => {
  const { mentorId } = req.params;
  const { body } = req;

  try {
    // Check if mentorId is provided
    if (!mentorId) {
      return res.status(400).send({ msg: "Mentor ID not provided" });
    }

    // Update the mentor data based on the provided mentorId
    const updatedMentor = await teacher.updateOne(
      { id: mentorId },
      { $set: { ...body, id: mentorId } }
    );

    // Check if mentor data was successfully updated
    if (updatedMentor) {
      return res.send("Mentor data updated successfully");
    } else {
      // If mentor with provided ID is not found, send a 404 error response
      return res.status(404).send({ msg: "Mentor not found" });
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Send a generic error response if MongoDB service is unavailable
    return res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

mentorRouter.delete("/:mentorId", async (req, res) => {
  const { mentorId } = req.params;

  try {
    // Check if mentorId is provided
    if (!mentorId) {
      return res.status(400).send({ msg: "Mentor ID not provided" });
    }

    // Find the mentor data based on the provided mentorId
    const mentorData = await teacher.findOne({ id: mentorId });

    // Check if mentor data is found
    if (mentorData) {
      // Delete the mentor from the database
      await teacher.deleteOne({ id: mentorId });
      return res.send("Mentor removed successfully");
    } else {
      // If mentor with provided ID is not found, send a 404 error response
      return res.status(404).send({ msg: "No Mentor found" });
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);

    // Send a generic error response if MongoDB service is unavailable
    return res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

mentorRouter.patch("/assign-student/:mentorId", async (req, res) => {
  const { mentorId } = req.params;
  const { studentIds } = req.body;

  // Validate input
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res
      .status(400)
      .send({ msg: "Invalid input: studentIds must be a non-empty array" });
  }

  try {
    const results = await Promise.all(
      studentIds.map(async (stuId) => {
        // Find the student record based on the provided student ID
        const studentRecord = await student.findOne({ id: stuId });

        // If student record is not found, return failure message
        if (!studentRecord) {
          return { stuId, success: false, message: "Student not found" };
        }

        const { currentTeacherId } = studentRecord;

        // If student is not assigned to any teacher, assign to the mentor
        if (currentTeacherId === null) {
          await teacher.updateOne(
            { id: mentorId },
            { $push: { students: stuId } }
          );
          await student.updateOne(
            { id: stuId },
            { $set: { currentTeacherId: mentorId } }
          );
          return { stuId, success: true };
        } else {
          // If student is already assigned to a teacher, return failure message
          return {
            stuId,
            success: false,
            message: `Student already assigned to ${currentTeacherId}`,
          };
        }
      })
    );

    // Filter successful and failed assignments
    const successAssignments = results.filter((r) => r.success);
    const failedAssignments = results.filter((r) => !r.success);

    // Send response with details of successful and failed assignments
    res.send({
      msg: "Student assignment process completed",
      successAssignments,
      failedAssignments,
    });
  } catch (error) {
    console.error(error);
    // Send a generic error response if MongoDB service is unavailable
    res
      .status(500)
      .send({ msg: "MongoDB service is stopped, Please try again later" });
  }
});

export default mentorRouter;
