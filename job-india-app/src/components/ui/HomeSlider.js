import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';

import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;
const ITEM_HEIGHT = 160;

export default function HomeSlider({ data = [], navigation }) {
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // 🔥 Auto scroll
  useEffect(() => {
    if (!data.length) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= data.length) nextIndex = 0;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, data]);

  // 🔥 Handle navigation logic
  const handlePress = async (item) => {
    if (!item) return;

    const { redirectType, redirectValue } = item;

    switch (redirectType) {
      case 'external':
        if (redirectValue) {
          const supported = await Linking.canOpenURL(redirectValue);
          if (supported) {
            Linking.openURL(redirectValue);
          }
        }
        break;

      case 'job':
        navigation?.navigate('JobDetails', { id: redirectValue });
        break;

      case 'category':
        navigation?.navigate('Category', { id: redirectValue });
        break;

      default:
        // do nothing
        break;
    }
  };

  const onScrollEnd = (e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / ITEM_WIDTH
    );
    setActiveIndex(index);
  };

  const renderItem = ({ item }) => {
    if (!item || !item.image) return null;

    const showText = item.title || item.subtitle;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handlePress(item)}
        style={styles.card}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* 🔥 ONLY SHOW OVERLAY IF TITLE/SUBTITLE EXISTS */}
        {showText ? (
          <View style={styles.overlay}>
            {item.title ? (
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
            ) : null}

            {item.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (!data.length) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
      />

      {/* Pagination */}
      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: SPACING.md,
  },

  card: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginHorizontal: SPACING.sm ,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  title: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.white,
  },

  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    marginTop: 2,
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.gray300,
    marginHorizontal: 3,
  },

  activeDot: {
    backgroundColor: COLORS.primary,
    width: 9,
    height: 9,
  },
});