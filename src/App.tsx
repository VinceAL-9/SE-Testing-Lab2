import React, { useState, useEffect } from "react";
import "./App.css";
import "./index.css";
import { supabase } from "./createClient";

interface User {
  id: number;
  name: string;
  age: number | string;
}

interface NewUser {
  name: string;
  age: string;
}

export default function App(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<NewUser>({ name: "", age: "" });
  const [user2, setUser2] = useState<User>({ id: 0, name: "", age: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUser({ ...user, [e.target.name]: e.target.value });
  }
  function handleChange2(e: React.ChangeEvent<HTMLInputElement>) {
    setUser2({ ...user2, [e.target.name]: e.target.value } as User);
  }

  //Read Operation
  async function fetchUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("id");
    if (error) console.log(error);
    else setUsers(data as User[]);
  }

  //Creation Operation
  async function createUsers(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("users")
      .insert([{ name: user.name, age: user.age }]);
    if (error) console.log(error);
    else {
      fetchUsers();
      window.location.reload();
    }
  }

  //Delete Operation
  async function deleteUser(userId: number) {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) console.log(error);
    else fetchUsers();
  }

  function displayUser(userId: number) {
    users.map((u) => {
      if (u.id === userId) {
        setUser2({ id: u.id, name: u.name, age: u.age });
      }
    });
  }

  //Update Operation
  async function updateUsers(userId: number, e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase
      .from("users")
      .update({ id: user2.id, name: user2.name, age: user2.age })
      .eq("id", userId);
    if (error) console.log(error);
    else {
      fetchUsers();
      window.location.reload();
    }
  }

  return (
    <div>
      <div className="container">
        <h1>Learning CRUD Operations</h1>

        <div className="operation">
          <div className="creation">
            <h2>Creation</h2>

            <form onSubmit={createUsers}>
              <h4>Name</h4>
              <input
                type="text"
                placeholder="Name"
                name="name"
                onChange={handleChange}
              />
              <h4>Age</h4>
              <input
                type="number"
                placeholder="Age"
                name="age"
                onChange={handleChange}
              />
              <button type="submit">Create</button>
            </form>
          </div>

          {/* Updation Form */}

          <div className="updation">
            <h2>Edit</h2>

            <form onSubmit={(e) => updateUsers(user2.id as number, e)}>
              <h4>Name</h4>
              <input
                type="text"
                defaultValue={String(user2.name)}
                name="name"
                onChange={handleChange2}
              />
              <h4>Age</h4>
              <input
                type="number"
                defaultValue={String(user2.age)}
                name="age"
                onChange={handleChange2}
              />
              <button type="submit">Save</button>
            </form>
          </div>
        </div>

        <h1 className="table">Table</h1>
        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Age</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}.</td>
                <td>{user.name}</td>
                <td>{user.age}</td>
                <td>
                  <button
                    onClick={() => {
                      deleteUser(user.id);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      displayUser(user.id);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
