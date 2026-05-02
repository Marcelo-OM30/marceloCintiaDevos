import React, { forwardRef } from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { CardConfig, CardFormat, CARD_DIMS } from '@/stores/cardStore';

interface CardPreviewProps {
  config: CardConfig;
  scale?: number; // scale down for preview (1 = full size, 0.5 = half)
}

const CardPreview = forwardRef<ViewShot, CardPreviewProps>(
  ({ config, scale = 1 }, ref) => {
    const dims = CARD_DIMS[config.format];
    const w = dims.w * scale;
    const h = dims.h * scale;

    const renderBackground = () => {
      if (config.background.type === 'gradient') {
        return (
          <LinearGradient
            colors={config.background.gradientColors}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }
      if (config.background.type === 'image' && config.background.imageUri) {
        return (
          <ImageBackground
            source={{ uri: config.background.imageUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        );
      }
      // solid color
      return (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: config.background.color },
          ]}
        />
      );
    };

    return (
      <ViewShot
        ref={ref}
        options={{ format: 'png', quality: 1 }}
        style={{ width: w, height: h, overflow: 'hidden', borderRadius: 12 * scale }}
      >
        {/* Background */}
        {renderBackground()}

        {/* Dark overlay */}
        {config.overlayOpacity > 0 && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: `rgba(0,0,0,${config.overlayOpacity})` },
            ]}
          />
        )}

        {/* Text blocks */}
        {config.textBlocks.map((block) => (
          <View
            key={block.id}
            style={{
              position: 'absolute',
              left: (block.paddingH / 100) * w,
              right: (block.paddingH / 100) * w,
              top: block.positionY * h - (block.fontSize * scale * 2),
            }}
          >
            <Text
              style={{
                fontSize: block.fontSize * scale,
                fontFamily: block.fontFamily === 'System' ? undefined : block.fontFamily,
                color: block.color,
                textAlign: block.align,
                fontWeight: block.bold ? 'bold' : 'normal',
                fontStyle: block.italic ? 'italic' : 'normal',
                lineHeight: block.fontSize * scale * 1.4,
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {block.content}
            </Text>
          </View>
        ))}

        {/* Logo watermark */}
        {config.showLogo && (
          <View
            style={{
              position: 'absolute',
              bottom: 12 * scale,
              right: 14 * scale,
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 9 * scale,
                fontWeight: '600',
                letterSpacing: 0.5,
              }}
            >
              MarceloCintia Devos
            </Text>
          </View>
        )}
      </ViewShot>
    );
  },
);

CardPreview.displayName = 'CardPreview';
export default CardPreview;
