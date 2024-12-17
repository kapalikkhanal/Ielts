import '../../public/global.css'
import { Video, Img, useVideoConfig, staticFile } from 'remotion';
import { Helmet } from 'react-helmet';

export const VideoBackground = ({ newsData }) => {
    const { width, height } = useVideoConfig();

    if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
        return null;
    }

    const { videoContent } = newsData[0];

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>

            <Helmet>
                <link
                    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Belleza&display=swap"
                    rel="stylesheet"
                />
            </Helmet>

            <Img
                src={staticFile('/images/background.png')}
                style={{
                    width: width,
                    height: height,
                    objectFit: 'cover',
                }}
                onError={(event) => {
                    // Handle image loading error here
                }}
            />

            {/* Word */}
            <div
                style={{
                    position: 'absolute',
                    top: '612px',
                    left: '225px'
                }}
            >
                {Array.isArray(newsData) && newsData.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'start', flexDirection: 'column', marginRight: '180px' }}>
                        <p style={{
                            color: 'black',
                            fontSize: '84px',
                            textAlign: 'left',
                            marginBottom: -10,
                            textTransform: 'lowercase',
                            fontFamily: "'Belleza','Noto Sans Devanagari', sans-serif"
                        }}>
                            {videoContent.word}
                        </p>
                    </div>
                )}
            </div>

            {/* Noun / adjective  */}
            <div
                style={{
                    position: 'absolute',
                    top: '815px',
                    left: '110px'
                }}
            >
                {Array.isArray(newsData) && newsData.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'start', flexDirection: 'column', marginRight: '180px' }}>
                        <p style={{
                            color: 'black',
                            fontSize: '36px',
                            textAlign: 'left',
                            marginBottom: -10,
                            fontFamily: "'Cormorant Garamond','Noto Sans Devanagari', sans-serif"
                        }}>
                            {videoContent.pronunciation}  {videoContent.type}
                        </p>
                    </div>
                )}
            </div>

            {/* Meaning  */}
            <div
                style={{
                    position: 'absolute',
                    top: '900px',
                    left: '110px'
                }}
            >
                {Array.isArray(newsData) && newsData.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'start', flexDirection: 'column', marginRight: '180px' }}>
                        <p style={{
                            color: 'black',
                            fontSize: '40px',
                            textAlign: 'left',
                            marginBottom: -10,
                            fontFamily: "'Belleza','Noto Sans Devanagari', sans-serif"
                        }}>
                            {videoContent.meaning}
                        </p>
                    </div>
                )}
            </div>

            {/* Synonyms  */}
            <div
                style={{
                    position: 'absolute',
                    top: '1132px',
                    left: '255px'
                }}
            >
                {Array.isArray(newsData) && newsData.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'start', flexDirection: 'column', marginRight: '180px' }}>
                        <p style={{
                            color: 'black',
                            fontSize: '40px',
                            fontStyle: 'italic',
                            textAlign: 'left',
                            marginBottom: -10,
                            textTransform: 'lowercase',
                            fontFamily: "'Cormorant Garamond','Noto Sans Devanagari', sans-serif"
                        }}>
                            {videoContent.synonyms1}, {videoContent.synonyms2}, {videoContent.synonyms3}
                        </p>
                    </div>
                )}
            </div>

            {/* Examples  */}
            <div
                style={{
                    position: 'absolute',
                    top: '1236px',
                    left: '110px'
                }}
            >
                {Array.isArray(newsData) && newsData.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'start', flexDirection: 'column', marginRight: '200px' }}>
                        <p style={{
                            color: 'black',
                            fontSize: '40px',
                            textAlign: 'left',
                            marginBottom: -10,
                            fontFamily: "'Belleza','Noto Sans Devanagari', sans-serif"
                        }}>
                            {videoContent.example1}
                        </p>
                        <p style={{
                            color: 'black',
                            fontSize: '40px',
                            textAlign: 'left',
                            marginBottom: -10,
                            fontFamily: "'Belleza','Noto Sans Devanagari', sans-serif"
                        }}>
                            {videoContent.example2}
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};