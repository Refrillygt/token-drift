const App = () => {
    return (
        <div>
            <div style={{ padding: 13 }}>
                Should warn: padding near `md` (12)
            </div>

            <div style={{ padding: 12 }}>
                Should NOT warn: exact token match
            </div>

            <div style={{ padding: 100 }}>
                Should NOT warn: far from all tokens
            </div>

            <div style={{ margin: 9, gap: 15 }}>
                Should warn TWICE: margin near `sm` (8), gap near `lg` (16)
            </div>

            <div
                style={{
                    // token-drift-disable-next-line
                    padding: 13,
                }}
            >
                Should NOT warn: ignored via comment
            </div>

            <div style={{ color: '#3467FE' }}>
                Should warn: color near `primary`
            </div>

            <div style={{ color: '#3366FF' }}>
                Should NOT warn: exact color token match
            </div>

            <div style={{ backgroundColor: '#111111' }}>
                Should NOT warn: color far from all tokens
            </div>
        </div>
    );
};

export default App;
