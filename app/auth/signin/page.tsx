"use client"
import React from 'react'
import { AuthSignIn } from '@/components/ui/auth-signin'
import { AuthSignUp } from '@/components/ui/auth-signup'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut } from '@/components/ui/auth-guards'
import Link from 'next/link'

const page = () => {
    return (
        <>
            <SignedOut>

                <div className='p-0 h-screen flex pt-24'>
                    <div className='w-full mx-auto md:h-[40vh] max-w-[80vw] md:max-w-[50vw] '>
                        <Tabs defaultValue='SignIn' className='w-full'>
                            <TabsList className='w-full'>
                                <TabsTrigger value='SignIn' >SignIn</TabsTrigger>
                                <TabsTrigger value='SignUp' >SignUp</TabsTrigger>
                            </TabsList>
                            {/* <TabsTrigger value='SignUp' /> */}

                            <TabsContent value='SignIn'>
                                <AuthSignIn />

                            </TabsContent>
                            <TabsContent value='SignUp'>
                                <AuthSignUp />

                            </TabsContent>
                        </Tabs>

                    </div>
                </div>
            </SignedOut>
            <SignedIn>
                <div className='flex flex-col h-full justify-center items-center p-8 space-y-4'>
                    <div className='text-5xl'>

                        You Are Already Signed In !
                    </div>
                    <Link href={"/"}>
                        <Button>
                            Go to Home
                        </Button>
                    </Link>
                </div>
            </SignedIn>
        </>

    )
}

export default page