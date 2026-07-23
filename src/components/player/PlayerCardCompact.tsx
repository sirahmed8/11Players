'use client';

import React from 'react';
import PlayerCard, { PlayerCardProps } from '@/components/player/PlayerCard';

export interface PlayerCardCompactProps extends Omit<PlayerCardProps, 'variant'> {}

const PlayerCardCompact = React.memo(function PlayerCardCompact(props: PlayerCardCompactProps) {
  return <PlayerCard {...props} variant="compact" />;
});

export default PlayerCardCompact;
