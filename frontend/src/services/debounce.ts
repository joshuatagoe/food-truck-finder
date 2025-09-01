export default function debounce<T extends (...args: any[]) => Promise<any>>(
    func: T,
    delay: number = 1000
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {

    let timeoutId: ReturnType<typeof setTimeout>;

    return function (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {

        clearTimeout(timeoutId);

        return new Promise((resolve) => {
            timeoutId = setTimeout(async () => {
                const result = await func(...args);
                resolve(result);
            }, delay)
        })
    }
}