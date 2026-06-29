import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import type {
  ClientAiRecommendation,
  ClientProfile,
  ClientVisit,
  CreateClientInput,
  CreateVisitInput,
  SharedRegimen,
  UpdateClientInput,
} from '@/types/client.types';

function requireStylistId(stylistId?: string) {
  const uid = stylistId ?? auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in as a stylist.');
  return uid;
}

function clientsCollection(stylistId: string) {
  return collection(db, 'users', stylistId, 'clients');
}

function clientDocument(stylistId: string, clientId: string) {
  return doc(db, 'users', stylistId, 'clients', clientId);
}

function visitsCollection(stylistId: string, clientId: string) {
  return collection(db, 'users', stylistId, 'clients', clientId, 'visits');
}

function recommendationsCollection(stylistId: string, clientId: string) {
  return collection(db, 'users', stylistId, 'clients', clientId, 'aiRecommendations');
}

export async function createClient(input: CreateClientInput, stylistId?: string) {
  const uid = requireStylistId(stylistId);
  const ref = await addDoc(clientsCollection(uid), {
    ...input,
    stylistId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getClient(clientId: string, stylistId?: string): Promise<ClientProfile | null> {
  const uid = requireStylistId(stylistId);
  const snap = await getDoc(clientDocument(uid, clientId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ClientProfile, 'id'>) };
}

export async function listClients(stylistId?: string): Promise<ClientProfile[]> {
  const uid = requireStylistId(stylistId);
  const q = query(clientsCollection(uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClientProfile, 'id'>) }));
}

export async function updateClient(clientId: string, input: UpdateClientInput, stylistId?: string) {
  const uid = requireStylistId(stylistId);
  await updateDoc(clientDocument(uid, clientId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClient(clientId: string, stylistId?: string) {
  const uid = requireStylistId(stylistId);
  await deleteDoc(clientDocument(uid, clientId));
}

export async function addVisit(clientId: string, input: CreateVisitInput, stylistId?: string) {
  const uid = requireStylistId(stylistId);
  const ref = await addDoc(visitsCollection(uid, clientId), {
    ...input,
    clientId,
    stylistId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const lastFormulaUsed = input.services
    .map((service) => service.formulaUsed)
    .filter(Boolean)
    .join(' | ');

  await updateDoc(clientDocument(uid, clientId), {
    lastVisitAt: input.date,
    lastFormulaUsed: lastFormulaUsed || null,
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listVisits(clientId: string, stylistId?: string, max = 25): Promise<ClientVisit[]> {
  const uid = requireStylistId(stylistId);
  const q = query(visitsCollection(uid, clientId), orderBy('date', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClientVisit, 'id'>) }));
}

export async function getVisit(clientId: string, visitId: string, stylistId?: string): Promise<ClientVisit | null> {
  const uid = requireStylistId(stylistId);
  const snap = await getDoc(doc(db, 'users', uid, 'clients', clientId, 'visits', visitId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ClientVisit, 'id'>) };
}

export async function deleteVisit(clientId: string, visitId: string, stylistId?: string) {
  const uid = requireStylistId(stylistId);
  await deleteDoc(doc(db, 'users', uid, 'clients', clientId, 'visits', visitId));
}

export async function saveAiRecommendation(
  clientId: string,
  recommendation: Omit<ClientAiRecommendation, 'id' | 'clientId' | 'stylistId' | 'createdAt'>,
  stylistId?: string,
) {
  const uid = requireStylistId(stylistId);
  const ref = await addDoc(recommendationsCollection(uid, clientId), {
    ...recommendation,
    clientId,
    stylistId: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listAiRecommendations(clientId: string, stylistId?: string, max = 10) {
  const uid = requireStylistId(stylistId);
  const q = query(recommendationsCollection(uid, clientId), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClientAiRecommendation, 'id'>) }));
}

export async function shareRegimenWithClient(clientId: string, regimen: SharedRegimen, stylistId?: string) {
  const uid = requireStylistId(stylistId);
  await updateDoc(clientDocument(uid, clientId), {
    sharedRegimen: {
      ...regimen,
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}
