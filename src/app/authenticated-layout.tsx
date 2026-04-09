'use client';

import React, { useEffect } from 'react';
import { useUser, useAuth } from '@/firebase/provider';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react';

export function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isUserLoading, userError } = useUser();
    const { toast } = useToast();
    const auth = useAuth();
    const [isLoggingIn, setIsLoggingIn] = React.useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        toast({
            title: 'Conectando con Google',
            description: 'Redirigiendo para iniciar sesión...',
        });

        try {
            await initiateGoogleSignIn(auth);
        } catch (error: any) {
            console.error("Login component error:", error);
            setIsLoggingIn(false);
            toast({
                title: 'Error de Conexión',
                description: `No se pudo iniciar la sesión: ${error.message || 'Error desconocido'}.`,
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        if (userError) {
            toast({
                title: 'Error de Autenticación',
                description: userError.message || 'Ocurrió un error al intentar iniciar sesión.',
                variant: 'destructive',
            });
        }
    }, [userError, toast]);

    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-muted/30 p-4">
                <div className="p-8 bg-background rounded-2xl shadow-2xl border flex flex-col items-center gap-6 max-w-md text-center transform transition-all duration-500 hover:scale-[1.02]">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-3 tracking-tight">Acceso Privado</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            Esta aplicación requiere autenticación. Por favor, inicia sesión con tu cuenta de Google.
                        </p>
                    </div>
                    <Button 
                        onClick={handleLogin} 
                        disabled={isLoggingIn}
                        className="w-full h-12 text-lg font-semibold relative overflow-hidden group transition-all"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                        {isLoggingIn ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <LogIn className="w-5 h-5 mr-3" />
                        )}
                        {isLoggingIn ? 'Cargando...' : 'Entrar con Google'}
                    </Button>
                    <p className="text-xs text-muted-foreground/60">
                        &copy; 2026 ArquitectoManchego Ecosystem
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
