import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, addDoc, doc, setDoc } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";
import { useAuth } from "../contexts/AuthContext";

const AdminHierarchy = () => {
  const { db } = useFirebase();
  const { user } = useAuth();
  if (!user?.roles?.includes("super_user")) {
    return <p>Access denied. You do not have permission to view this page.</p>;
  }
  const [states, setStates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [stateAssociations, setStateAssociations] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [clubs, setClubs] = useState([]);

  // New State form
  const [showNewStateForm, setShowNewStateForm] = useState(false);
  const [newStateName, setNewStateName] = useState("");
  // New Region form
  const [showNewRegionForm, setShowNewRegionForm] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  const [newRegionStateId, setNewRegionStateId] = useState("");
  // New State Association form
  const [showNewStateAssocForm, setShowNewStateAssocForm] = useState(false);
  const [newStateAssocName, setNewStateAssocName] = useState("");
  const [newStateAssocStateId, setNewStateAssocStateId] = useState("");
  // New Association form
  const [showNewAssocForm, setShowNewAssocForm] = useState(false);
  const [newAssocName, setNewAssocName] = useState("");
  const [newAssocRegionId, setNewAssocRegionId] = useState("");
  const [newAssocStateAssocId, setNewAssocStateAssocId] = useState("");
  // New Club form
  const [showNewClubForm, setShowNewClubForm] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubAssocId, setNewClubAssocId] = useState("");

  const loadHierarchy = async () => {
    if (!db) return;
    const [statesSnap, regionsSnap, stateAssocSnap, assocSnap, clubsSnap] = await Promise.all([
      getDocs(query(collection(db, "states"), orderBy("name"))),
      getDocs(query(collection(db, "regions"), orderBy("name"))),
      getDocs(query(collection(db, "state_associations"), orderBy("name"))),
      getDocs(query(collection(db, "associations"), orderBy("name"))),
      getDocs(query(collection(db, "clubs"), orderBy("name"))),
    ]);
    setStates(statesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setRegions(regionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setStateAssociations(stateAssocSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setAssociations(assocSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setClubs(clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    loadHierarchy();
    // eslint-disable-next-line
  }, [db]);

  // State: Add new state
  const handleAddState = async () => {
    if (!newStateName.trim()) return;
    await addDoc(collection(db, "states"), { name: newStateName.trim() });
    setNewStateName("");
    setShowNewStateForm(false);
    await loadHierarchy();
  };

  // Region: Add new region
  const handleAddRegion = async () => {
    if (!newRegionName.trim() || !newRegionStateId) return;
    await addDoc(collection(db, "regions"), { name: newRegionName.trim(), state_id: newRegionStateId });
    setNewRegionName("");
    setNewRegionStateId("");
    setShowNewRegionForm(false);
    await loadHierarchy();
  };

  // State Association: Add new state association
  const handleAddStateAssoc = async () => {
    if (!newStateAssocName.trim() || !newStateAssocStateId) return;
    await addDoc(collection(db, "state_associations"), { name: newStateAssocName.trim(), state_id: newStateAssocStateId });
    setNewStateAssocName("");
    setNewStateAssocStateId("");
    setShowNewStateAssocForm(false);
    await loadHierarchy();
  };

  // Association: Add new association
  const handleAddAssoc = async () => {
    if (!newAssocName.trim() || !newAssocRegionId || !newAssocStateAssocId) return;
    await addDoc(collection(db, "associations"), {
      name: newAssocName.trim(),
      region_id: newAssocRegionId,
      state_association_id: newAssocStateAssocId
    });
    setNewAssocName("");
    setNewAssocRegionId("");
    setNewAssocStateAssocId("");
    setShowNewAssocForm(false);
    await loadHierarchy();
  };

  // Club: Add new club
  const handleAddClub = async () => {
    if (!newClubName.trim() || !newClubAssocId) return;
    await addDoc(collection(db, "clubs"), {
      name: newClubName.trim(),
      association_id: newClubAssocId
    });
    setNewClubName("");
    setNewClubAssocId("");
    setShowNewClubForm(false);
    await loadHierarchy();
  };

  return (
    <div className="admin-hierarchy">
      <h1>Admin - Hierarchy Management</h1>
      <section>
        <h2>States</h2>
        <button onClick={() => setShowNewStateForm(s => !s)}>
          {showNewStateForm ? "Cancel" : "New State"}
        </button>
        {showNewStateForm && (
          <div style={{ margin: "0.5em 0" }}>
            <input
              type="text"
              value={newStateName}
              placeholder="State Name"
              onChange={e => setNewStateName(e.target.value)}
            />
            <button onClick={handleAddState}>Save</button>
          </div>
        )}
        <ul>{states.map(state => <li key={state.id}>{state.name}</li>)}</ul>
      </section>
      <section>
        <h2>Regions</h2>
        <button onClick={() => setShowNewRegionForm(s => !s)}>
          {showNewRegionForm ? "Cancel" : "New Region"}
        </button>
        {showNewRegionForm && (
          <div style={{ margin: "0.5em 0" }}>
            <input
              type="text"
              value={newRegionName}
              placeholder="Region Name"
              onChange={e => setNewRegionName(e.target.value)}
            />
            <select
              value={newRegionStateId}
              onChange={e => setNewRegionStateId(e.target.value)}
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state.id} value={state.id}>{state.name}</option>
              ))}
            </select>
            <button onClick={handleAddRegion}>Save</button>
          </div>
        )}
        <ul>{regions.map(region => {
          const state = states.find(s => s.id === region.state_id);
          return <li key={region.id}>{region.name} (State: {state?.name || "?"})</li>;
        })}</ul>
      </section>
      <section>
        <h2>State Associations</h2>
        <button onClick={() => setShowNewStateAssocForm(s => !s)}>
          {showNewStateAssocForm ? "Cancel" : "New State Association"}
        </button>
        {showNewStateAssocForm && (
          <div style={{ margin: "0.5em 0" }}>
            <input
              type="text"
              value={newStateAssocName}
              placeholder="State Association Name"
              onChange={e => setNewStateAssocName(e.target.value)}
            />
            <select
              value={newStateAssocStateId}
              onChange={e => setNewStateAssocStateId(e.target.value)}
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state.id} value={state.id}>{state.name}</option>
              ))}
            </select>
            <button onClick={handleAddStateAssoc}>Save</button>
          </div>
        )}
        <ul>{stateAssociations.map(sa => {
          const state = states.find(s => s.id === sa.state_id);
          return <li key={sa.id}>{sa.name} (State: {state?.name || "?"})</li>;
        })}</ul>
      </section>
      <section>
        <h2>Associations</h2>
        <button onClick={() => setShowNewAssocForm(s => !s)}>
          {showNewAssocForm ? "Cancel" : "New Association"}
        </button>
        {showNewAssocForm && (
          <div style={{ margin: "0.5em 0" }}>
            <input
              type="text"
              value={newAssocName}
              placeholder="Association Name"
              onChange={e => setNewAssocName(e.target.value)}
            />
            <select
              value={newAssocRegionId}
              onChange={e => setNewAssocRegionId(e.target.value)}
            >
              <option value="">Select Region</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            <select
              value={newAssocStateAssocId}
              onChange={e => setNewAssocStateAssocId(e.target.value)}
            >
              <option value="">Select State Association</option>
              {stateAssociations.map(sa => (
                <option key={sa.id} value={sa.id}>{sa.name}</option>
              ))}
            </select>
            <button onClick={handleAddAssoc}>Save</button>
          </div>
        )}
        <ul>{associations.map(a => {
          const region = regions.find(r => r.id === a.region_id);
          const stateAssoc = stateAssociations.find(s => s.id === a.state_association_id);
          return <li key={a.id}>{a.name} (Region: {region?.name || "?"}, State Assoc: {stateAssoc?.name || "?"})</li>;
        })}</ul>
      </section>
      <section>
        <h2>Clubs</h2>
        <button onClick={() => setShowNewClubForm(s => !s)}>
          {showNewClubForm ? "Cancel" : "New Club"}
        </button>
        {showNewClubForm && (
          <div style={{ margin: "0.5em 0" }}>
            <input
              type="text"
              value={newClubName}
              placeholder="Club Name"
              onChange={e => setNewClubName(e.target.value)}
            />
            <select
              value={newClubAssocId}
              onChange={e => setNewClubAssocId(e.target.value)}
            >
              <option value="">Select Association</option>
              {associations.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button onClick={handleAddClub}>Save</button>
          </div>
        )}
        <ul>{clubs.map(club => {
          const assoc = associations.find(a => a.id === club.association_id);
          return <li key={club.id}>{club.name} (Association: {assoc?.name || "?"})</li>;
        })}</ul>
      </section>
    </div>
  );
};

export default AdminHierarchy;