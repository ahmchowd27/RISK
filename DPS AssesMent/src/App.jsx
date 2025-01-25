import React, { useState, useEffect } from "react";
import jsonData from "./Database_Clean.json";
import ReactPaginate from "react-paginate";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  ZAxis,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import "./App.css";

const App = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    school: "",
    gender: "",
    fosterCare: "",
    ell: "",
  });
  const [searchQuery, setSearchQuery] = useState(""); // State for search query

  const itemsPerPage = 10;

  useEffect(() => {
    const { Student, Classes, Attendance, FinalGrades } = jsonData;

    // Graduation requirements
    const creditRequirements = {
      ELA: 4.0,
      MTH: 4.0,
      SCI: 4.0,
      SS: 3.0,
      LANG: 2.0,
      ART: 1.0,
      PE: 1.0,
    };

    const gradeBenchmarks = {
      9: 4.75,
      10: 9.5,
      11: 14.25,
      12: 19,
    };

    const enrichedStudents = Student.map((student) => {
      const studentAttendance = Attendance.filter(
        (att) => att.Student_ID === student.ID
      );

      const totalRecords = studentAttendance.length;
      const presentRecords = studentAttendance.filter(
        (att) => att.Code === "P"
      ).length;
      const attendanceRate =
        totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

      const studentGrades = FinalGrades.filter(
        (grade) => grade.Student_ID === student.ID
      );

      const creditsByType = studentGrades.reduce((acc, grade) => {
        if (grade.Letter_Grade !== "F") {
          acc[grade.Credit_Type] =
            (acc[grade.Credit_Type] || 0) + grade.Credit_Awarded;
        }
        return acc;
      }, {});

      const totalCreditsEarned = Object.values(creditsByType).reduce(
        (sum, credits) => sum + credits,
        0
      );

      const meetsCreditRequirement =
        totalCreditsEarned >= (gradeBenchmarks[student.Grade] || 0);

      const isAtRisk = attendanceRate < 75 || !meetsCreditRequirement;

      return {
        ...student,
        attendanceRate,
        totalCreditsEarned,
        creditsByType,
        isAtRisk,
      };
    });

    setStudents(enrichedStudents);
    setFilteredStudents(enrichedStudents);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const filtered = students.filter((student) => {
      return (
        (!filters.school || student.School === filters.school) &&
        (!filters.gender || student.Gender === filters.gender) &&
        (!filters.fosterCare ||
          student.Flag_FosterCare.toString() === filters.fosterCare) &&
        (!filters.ell ||
          student.Flag_EnglishLanguageLearner.toString() === filters.ell)
      );
    });
    setFilteredStudents(filtered);
    setCurrentPage(0);
  }, [filters, students]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query) {
      const searchedStudent = students.filter(
        (student) =>
          student.First_Name.toLowerCase().includes(query) ||
          student.Last_Name.toLowerCase().includes(query)
      );
      setFilteredStudents(searchedStudent);
    } else {
      setFilteredStudents(students);
    }
    setCurrentPage(0);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const displayedStudents = filteredStudents.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // ScatterChart Data: Group by Grade and School
  const scatterData = [];
  const schools = [...new Set(students.map((s) => s.School))];
  const grades = [9, 10, 11, 12];

  schools.forEach((school) => {
    grades.forEach((grade) => {
      const group = filteredStudents.filter(
        (s) => s.School === school && s.Grade === grade
      );
      const averageCredits =
        group.length > 0
          ? group.reduce((sum, s) => sum + s.totalCreditsEarned, 0) /
            group.length
          : 0;
      scatterData.push({ school, grade, averageCredits });
    });
  });

  // PieChart Data: At-Risk Students by Cause
  const riskByCause = [
    {
      name: "Low Attendance",
      value: filteredStudents.filter((s) => s.attendanceRate < 75).length,
    },
    {
      name: "Insufficient Credits",
      value: filteredStudents.filter((s) => !s.meetsCreditRequirement).length,
    },
  ];

  // BarChart Data: Average Attendance Rate by School
  const attendanceBySchool = schools.map((school) => {
    const studentsInSchool = students.filter((s) => s.School === school);
    const averageAttendance =
      studentsInSchool.reduce((sum, s) => sum + s.attendanceRate, 0) /
      studentsInSchool.length;

    return {
      school,
      averageAttendance: parseFloat(averageAttendance.toFixed(2)),
    };
  });

  return (
    <div className="container">
      <h1 className="title">Student Graduation Dashboard</h1>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by student name"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Filters */}
      <div className="filters">
        {/* Add filter dropdowns here */}
        <select
          name="school"
          value={filters.school}
          onChange={handleFilterChange}
          className="filter-dropdown"
        >
          <option value="">Filter by School</option>
          {[...new Set(students.map((s) => s.School))].map((school) => (
            <option key={school} value={school}>
              {school}
            </option>
          ))}
        </select>

        <select
          name="gender"
          value={filters.gender}
          onChange={handleFilterChange}
          className="filter-dropdown"
        >
          <option value="">Filter by Gender</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>

        <select
          name="fosterCare"
          value={filters.fosterCare}
          onChange={handleFilterChange}
          className="filter-dropdown"
        >
          <option value="">Filter by Foster Care</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>

        <select
          name="ell"
          value={filters.ell}
          onChange={handleFilterChange}
          className="filter-dropdown"
        >
          <option value="">Filter by ELL</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>

      <h2 className="subtitle">Credit Progress by School and Grade</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="category" dataKey="school" name="School" />
          <YAxis type="number" dataKey="grade" name="Grade" />
          <ZAxis
            type="number"
            dataKey="averageCredits"
            range={[0, 20]}
            name="Average Credits"
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name="Credit Progress" data={scatterData} fill="#82ca9d" />
        </ScatterChart>
      </ResponsiveContainer>

      {/* PieChart */}
      <h2 className="subtitle">At-Risk Students by Cause</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={true}
            data={riskByCause}
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            label
          />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* BarChart */}
      <h2 className="subtitle">Average Attendance Rate by School</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={attendanceBySchool}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="school" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="averageAttendance" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>

      {/* Student Table */}
      <h2 className="subtitle">At-Risk Students</h2>
      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Grade</th>
            <th>School</th>
            <th>Credits Earned</th>
            <th>Attendance Rate</th>
            <th>At Risk</th>
          </tr>
        </thead>
        <tbody>
          {displayedStudents.map((student) => (
            <tr key={student.ID}>
              <td>
                {student.First_Name} {student.Last_Name}
              </td>
              <td>{student.Grade}</td>
              <td>{student.School}</td>
              <td>{student.totalCreditsEarned}</td>
              <td>{student.attendanceRate.toFixed(2)}%</td>
              <td>{student.isAtRisk ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        pageCount={Math.ceil(filteredStudents.length / itemsPerPage)}
        onPageChange={handlePageChange}
        containerClassName={"react-paginate"}
        activeClassName={"active"}
      />
      <footer
        style={{
          textAlign: "center",
          marginTop: "20px",
          padding: "10px 0",
          background: "#f4f4f4",
        }}
      >
        <p>© 2025 Graduation Dashboard Ahmed Chowdhury. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default App;
