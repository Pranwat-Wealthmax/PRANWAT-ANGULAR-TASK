
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Student, StudentResponse } from '../models/student';

interface LocalStudentData {
  added: Student[];
  updated: Student[];
  deletedIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private http = inject(HttpClient);
  private apiUrl = 'https://dummyjson.com/users';
  private storageKey = 'student-management-data';

  private getLocalData(): LocalStudentData {
    const data = localStorage.getItem(this.storageKey);

    const localData: LocalStudentData = data
      ? JSON.parse(data)
      : { added: [], updated: [], deletedIds: [] };

    let changed = false;

    localData.added = localData.added.map((student, index) => {
      if (student.id < 1000000000000) {
        changed = true;

        return {
          ...student,
          id: Date.now() + index
        };
      }

      return student;
    });

    if (changed) {
      this.saveLocalData(localData);
    }

    return localData;
  }

  private saveLocalData(data: LocalStudentData): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private mergeStudents(apiStudents: Student[]): Student[] {
    const localData = this.getLocalData();

    let students = apiStudents.map(student => {
      const updatedStudent = localData.updated.find(
        item => item.id === student.id
      );

      return updatedStudent || student;
    });

    students = students.filter(
      student => !localData.deletedIds.includes(student.id)
    );

    students = [...localData.added].reverse().concat(students);

    return students;
  }

  private getAllStudents(): Observable<Student[]> {
    return this.http.get<StudentResponse>(
      `${this.apiUrl}?limit=0`
    ).pipe(
      map(response => this.mergeStudents(response.users))
    );
  }

  getStudents(limit: number, skip: number): Observable<StudentResponse> {
    return this.getAllStudents().pipe(
      map(students => ({
        users: students.slice(skip, skip + limit),
        total: students.length,
        skip,
        limit
      }))
    );
  }

  getLocalStudents(limit: number, skip: number): Observable<StudentResponse> {
    const students = [...this.getLocalData().added].reverse();

    return of({
      users: students.slice(skip, skip + limit),
      total: students.length,
      skip,
      limit
    });
  }

  searchStudents(query: string): Observable<StudentResponse> {
    return this.getAllStudents().pipe(
      map(students => {
        const filteredStudents = students.filter(student =>
          `${student.firstName} ${student.lastName}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );

        return {
          users: filteredStudents,
          total: filteredStudents.length,
          skip: 0,
          limit: filteredStudents.length
        };
      })
    );
  }

  getStudentById(id: number): Observable<Student> {
    return this.getAllStudents().pipe(
      map(students => {
        const student = students.find(item => item.id === id);

        if (!student) {
          throw new Error('Student not found');
        }

        return student;
      })
    );
  }

  addStudent(student: Omit<Student, 'id'>): Observable<Student> {
    const data = this.getLocalData();

    let newId = Date.now();

    while (
      data.added.some(item => item.id === newId) ||
      data.updated.some(item => item.id === newId)
    ) {
      newId++;
    }

    const newStudent: Student = {
      ...student,
      id: newId
    };

    data.added.push(newStudent);
    this.saveLocalData(data);

    return of(newStudent);
  }

  updateStudent(
    id: number,
    student: Omit<Student, 'id'>
  ): Observable<Student> {

    const updatedStudent: Student = {
      ...student,
      id
    };

    const data = this.getLocalData();

    const addedIndex = data.added.findIndex(
      item => item.id === id
    );

    if (addedIndex !== -1) {
      data.added[addedIndex] = updatedStudent;
    } else {
      const updatedIndex = data.updated.findIndex(
        item => item.id === id
      );

      if (updatedIndex !== -1) {
        data.updated[updatedIndex] = updatedStudent;
      } else {
        data.updated.push(updatedStudent);
      }
    }

    this.saveLocalData(data);

    return this.http.put<Student>(
      `${this.apiUrl}/${id}`,
      student
    ).pipe(
      map(() => updatedStudent),

      catchError(() => of(updatedStudent))
    );
  }

  deleteStudent(id: number): Observable<Student> {

    const data = this.getLocalData();

    data.added = data.added.filter(
      item => item.id !== id
    );

    data.updated = data.updated.filter(
      item => item.id !== id
    );

    if (!data.deletedIds.includes(id)) {
      data.deletedIds.push(id);
    }

    this.saveLocalData(data);

    return this.http.delete<Student>(
      `${this.apiUrl}/${id}`
    ).pipe(

      catchError(() => of({ id } as Student))
    );
  }
}
