import { Box, Typography } from '@mui/material';
import { getTypeColor, getTypeEmoji } from '../../utils/articleUtils';
import { useState } from 'react';

interface ArticleImageProps {
    imageUrl?: string;
    realEstateType: string;
    name: string;
}

const ArticleImage = ({ imageUrl, realEstateType, name }: ArticleImageProps) => {
    const [imageError, setImageError] = useState(false);

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {imageUrl && !imageError ? (
                <img 
                    src={`https://landthumb-phinf.pstatic.net/${encodeURI(imageUrl)}`} 
                    alt={name}
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                    }}
                    onError={(e) => {
                        console.error("Image load error:", imageUrl);
                        setImageError(true);
                    }}
                />
            ) : (
                <Box 
                    sx={{ 
                        width: '100%',
                        height: '100%',
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: getTypeColor(realEstateType),
                        color: 'white',
                        gap: 1
                    }}
                >
                    <Typography variant="h1" sx={{ fontSize: '3rem', lineHeight: 1 }}>
                        {getTypeEmoji(realEstateType)}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {realEstateType}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ArticleImage; 