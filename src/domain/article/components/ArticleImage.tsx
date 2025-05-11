import {Box, Typography} from '@mui/material';
import {useState} from 'react';
import {getTypeColor, getTypeEmoji} from '@/domain/article/utils/articleDisplay';
import {withImageSize} from '@/domain/article/utils/articleFormat';

interface ArticleImageProps {
    imageUrl?: string;
    articleType: string;
    name: string;
}

const ArticleImage = ({imageUrl, articleType, name}: ArticleImageProps) => {
    const [imageError, setImageError] = useState(false);

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: getTypeColor(articleType),
                minHeight: '200px'
            }}
        >
            {!imageError && imageUrl ? (
                <img
                    src={withImageSize(imageUrl, 1000)}
                    alt={name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                    }}
                    onError={() => setImageError(true)}
                />
            ) : (
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: '4rem',
                            color: 'white',
                            lineHeight: 1
                        }}
                    >
                        {getTypeEmoji(articleType)}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '1rem',
                            color: 'white',
                            mt: 1
                        }}
                    >
                        {name}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ArticleImage; 