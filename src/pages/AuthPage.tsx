import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Package, Mail, Lock, Chrome } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const isAdmin = email.toLowerCase() === 'juandavidrojas456@gmail.com';
        const userPath = `users/${cred.user.uid}`;
        try {
          await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            email: cred.user.email,
            role: isAdmin ? 'admin' : 'customer',
            balance: 0,
            createdAt: serverTimestamp()
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.WRITE, userPath);
        }
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const userPath = `users/${result.user.uid}`;
      try {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          const isAdmin = result.user.email?.toLowerCase() === 'juandavidrojas456@gmail.com';
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            email: result.user.email,
            photoURL: result.user.photoURL || '',
            role: isAdmin ? 'admin' : 'customer',
            balance: 0,
            createdAt: serverTimestamp()
          });
        }
      } catch (dbErr) {
        // If it was a getDoc failure, type is GET, if setDoc, type is WRITE
        const opType = (dbErr as any).code === 'permission-denied' ? OperationType.GET : OperationType.WRITE;
        handleFirestoreError(dbErr, opType, userPath);
      }
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError('La ventana emergente de inicio de sesión fue bloqueada por su navegador. Por favor permita las ventanas emergentes e intente de nuevo.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-steam-bg border border-steam-card rounded-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl mx-auto shadow-2xl mb-4 group hover:scale-110 transition-transform cursor-pointer">
            <Package className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white uppercase italic tracking-tighter">
            {isLogin ? 'Bienvenido de nuevo' : 'Únete a Steam offline'}
          </h1>
          <p className="text-steam-accent text-[10px] uppercase font-black tracking-widest opacity-50">Soluciones de Ventas Expertas para la Era Digital</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-steam-accent">Dirección de Correo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-accent/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-steam-dark border border-steam-card rounded py-2 pl-10 pr-4 focus:outline-none focus:border-steam-blue text-sm transition-colors text-white"
                placeholder="tu@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-steam-accent">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-accent/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-steam-dark border border-steam-card rounded py-2 pl-10 pr-4 focus:outline-none focus:border-steam-blue text-sm transition-colors text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white hover:bg-opacity-90 text-black font-black py-3 rounded-xl transition-all uppercase italic tracking-widest"
          >
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-steam-card" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-steam-bg px-2 text-steam-accent">O continuar con</span></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white hover:bg-steam-accent text-black font-bold py-2.5 rounded flex items-center justify-center gap-2 transition-all"
        >
          <Chrome className="w-4 h-4" />
          Cuenta de Google
        </button>

        <p className="text-center text-xs text-steam-accent">
          {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-steam-blue ml-1 font-bold hover:underline"
          >
            {isLogin ? 'Únete ahora' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
