import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });
api.interceptors.request.use(c => { const t=localStorage.getItem('token'); if(t) c.headers.Authorization=`Bearer ${t}`; return c; });
export const authAPI = { register:d=>api.post('/auth/register',d), login:d=>api.post('/auth/login',d) };
export const applicationsAPI = { getAll:()=>api.get('/applications'), create:d=>api.post('/applications',d), getTimeline:id=>api.get(`/applications/${id}/timeline`) };
export const adminAPI = { getAll:()=>api.get('/admin/applications'), update:(id,d)=>api.patch(`/admin/applications/${id}`,d) };
export default api;
