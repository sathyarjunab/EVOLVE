export default function LandingPage({ searchParams }: { searchParams: { email: string } }) {
    console.log("SAdsa", searchParams.email)
    return (
        <div>
            <iframe
                src={`/evolve_v7.html`}
                width="100%"
                height="1000"
                style={{
                    border: "none",
                }}
            />
        </div>
    )
}