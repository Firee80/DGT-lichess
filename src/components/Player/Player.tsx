export function Player({ name, rating, provisional = false, title }: { name: string, rating: number, provisional?: boolean, title?: string }) {
    return (
        <div className="player">
            <div>{title && title.length > 0 ? `${title} ${name}` : `${name}`}</div>
            {rating > 0 && (<div>{rating}{provisional ? '?' : ''}</div>)}
        </div>
    )
}
