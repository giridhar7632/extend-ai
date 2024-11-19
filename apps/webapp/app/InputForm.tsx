'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SummarySchema } from '@/lib/types'

const formSchema = z.object({
    url: z.string().url(),
})

export default function InputForm({
    type,
    formSubmit,
}: Readonly<{ type: 'online' | 'offline' }> & { formSubmit: (url: string) => Promise<SummarySchema> }) {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [summary, setSummary] = useState<SummarySchema | null>(null)
    const [timeTaken, setTimeTaken] = useState<string>('')
    const { toast } = useToast()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setSummary(null)
        const startTime = performance.now()
        try {
            const { url } = values
            if (url) {
                const res = await formSubmit(url)
                setSummary(res)
            }
        } catch (error) {
            console.error(error)
            const description = error instanceof Error ? error.message : 'Failed to summarize'
            toast({
                title: 'Uh oh! Something went wrong.',
                description,
            })
        }
        const endTime = performance.now() // End timing
        const timeTaken = endTime - startTime // Calculate time taken
        console.log(`Time taken for response: ${timeTaken.toFixed(2)} ms`)
        setTimeTaken(timeTaken.toFixed(2))
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col gap-12">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 w-full">
                    <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder="Enter the link to article" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading}>
                        Submit
                    </Button>
                </form>
            </Form>
            {isLoading ? (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Skeleton className="w-40 h-4 rounded-full" />
                        </CardTitle>
                        <CardDescription>
                            <Skeleton className="w-80 h-4 rounded-full" />
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-2 px-6">
                            {new Array(3).fill(0).map((_, index) => (
                                <li key={index}>
                                    <Skeleton className="w-32 h-4 rounded-full" />
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                        <Skeleton className="w-8 h-4 rounded-full" />
                        <Skeleton className="w-8 h-4 rounded-full" />
                    </CardFooter>
                </Card>
            ) : summary ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{summary?.title}</CardTitle>
                        {type === 'online' && <CardDescription>{summary?.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal px-6">
                            {summary?.key_points?.map((key_point, index) => <li key={index}>{key_point}</li>)}
                        </ol>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                        <p className="text-sm italic text-neutral-500">
                            {new Date(summary?.date || '').toUTCString().substring(0, 17)}
                        </p>
                        <p className="text-sm italic text-neutral-500">
                            {summary?.cached && '(⚡️ cached)'} {timeTaken} ms
                        </p>
                    </CardFooter>
                </Card>
            ) : null}
        </div>
    )
}
