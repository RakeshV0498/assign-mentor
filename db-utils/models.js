import { Schema, model } from "mongoose";

const studentSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  batchNo: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  currentTeacherId: {
    type: String,
    required: false,
    default: null,
  },
  prevTeacherId: {
    type: String,
    required: false,
    default: null,
  },
});

const teacherSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  specialized: {
    type: String,
    required: true,
  },

  students: {
    type: Array,
    required: true,
  },
});

const student = model("student", studentSchema, "students_db");
const teacher = model("teacher", teacherSchema, "teachers_db");

export { student, teacher };
