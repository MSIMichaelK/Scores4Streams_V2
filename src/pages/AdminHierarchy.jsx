import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";

const AdminHierarchy = () => {
  const { db } = useFirebase();
  // TODO: Restrict access to this page to users with role 'admin' or 'super_user'
  const [states, setStates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [stateAssociations, setStateAssociations] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    if (!db) return;
    const loadHierarchy = async () => {
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
    loadHierarchy();
  }, [db]);

  return (
    <div className="admin-hierarchy">
      <h1>Admin - Hierarchy Management</h1>
      <section>
        <h2>States</h2>
        <ul>{states.map(state => <li key={state.id}>{state.name}</li>)}</ul>
      </section>
      <section>
        <h2>Regions</h2>
        <ul>{regions.map(region => {
          const state = states.find(s => s.id === region.state_id);
          return <li key={region.id}>{region.name} (State: {state?.name || "?"})</li>;
        })}</ul>
      </section>
      <section>
        <h2>State Associations</h2>
        <ul>{stateAssociations.map(sa => {
          const state = states.find(s => s.id === sa.state_id);
          return <li key={sa.id}>{sa.name} (State: {state?.name || "?"})</li>;
        })}</ul>
      </section>
      <section>
        <h2>Associations</h2>
        <ul>{associations.map(a => {
          const region = regions.find(r => r.id === a.region_id);
          const stateAssoc = stateAssociations.find(s => s.id === a.state_association_id);
          return <li key={a.id}>{a.name} (Region: {region?.name || "?"}, State Assoc: {stateAssoc?.name || "?"})</li>;
        })}</ul>
      </section>
      <section>
        <h2>Clubs</h2>
        <ul>{clubs.map(club => {
          const assoc = associations.find(a => a.id === club.association_id);
          return <li key={club.id}>{club.name} (Association: {assoc?.name || "?"})</li>;
        })}</ul>
      </section>
    </div>
  );
};

export default AdminHierarchy;