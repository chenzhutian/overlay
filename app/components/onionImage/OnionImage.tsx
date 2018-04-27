import * as React from 'react';
import * as mousetrap from 'mousetrap';
import styled from 'styled-components';
import * as interactjs from 'interactjs';
import { Coords } from '../helpers/Coords';
import { Size } from '../helpers/Size';
import { IOnionImage } from './IOnionImage.d';
import { MiniToolbox } from './MiniToolbox';

interface State {
  opacity: number;
  inverted: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

const OnionImageWrapper = styled.div.attrs({})`
  position: fixed;
  border: 1px solid transparent;

  &:hover {
    border: 1px dashed rgba(0, 255, 255, 0.4);
  }

  & ${Coords}, & ${Size} {
    display: none;
  }

  &:hover ${Coords}, &:hover ${Size} {
    display: initial;
  }
`;

interface OnionImageElementProps {
  opacity: number;
  inverted: boolean;
}

const OnionImageElement = styled.img.attrs<OnionImageElementProps>({
  opacity: (props: OnionImageElementProps) => props.opacity,
  inverted: (props: OnionImageElementProps) => props.inverted
})`
  opacity: ${({ opacity }) => opacity};
  filter: invert(${({ inverted }) => (inverted ? '100%' : '0%')});
`;

const setPosition = (el, x, y) => {
  el.style.webkitTransform = el.style.transform = `translate(${x}px,${y}px)`;
  el.setAttribute('data-x', x);
  el.setAttribute('data-y', y);
};

const opacityNumberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const opacityLettersKeys = ['=', '+', '-', '_'];
const invertKeys = 'i';
const arrowKeys = [
  'up',
  'shift+up',
  'down',
  'shift+down',
  'left',
  'shift+left',
  'right',
  'shift+right'
];

interface Props {
  remove: () => void;
}

export default class OnionImage extends React.Component<
  IOnionImage & Props,
  State
> {
  private el: HTMLDivElement;
  state = {
    opacity: 1,
    inverted: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  setInverted = (value: boolean) => {
    this.setState({
      inverted: value
    });
  };

  bindKeys() {
    mousetrap.bind(opacityNumberKeys, ({ key }) => {
      const val = parseInt(key, 10) * 0.1;
      this.setState({
        ...this.state,
        opacity: val === 0 ? 1 : val
      });
    });

    mousetrap.bind(opacityLettersKeys, ({ keyCode }) => {
      let value = 0.05;
      if (keyCode === 45 || keyCode === 95) {
        // - 45 _ 95
        value *= -1;
      } else if (keyCode === 61 || keyCode === 43) {
        // = 61 + 43
        value *= 1;
      }

      const { opacity } = this.state;
      const newOpacity = Math.max(0, Math.min(1, opacity + value));

      this.setState({
        opacity: newOpacity
      });
    });

    mousetrap.bind(invertKeys, () => {
      this.setInverted(!this.state.inverted);
    });

    mousetrap.bind(arrowKeys, ({ shiftKey, key }) => {
      const el = this.el;
      const { x, y } = this.state;
      const value = shiftKey ? 10 : 1;

      if (key === 'ArrowUp') {
        this.setState({ y: y - value }, () => setPosition(el, x, y));
      } else if (key === 'ArrowDown') {
        this.setState({ y: y + value }, () => setPosition(el, x, y));
      } else if (key === 'ArrowLeft') {
        this.setState({ x: x - value }, () => setPosition(el, x, y));
      } else if (key === 'ArrowRight') {
        this.setState({ x: x + value }, () => setPosition(el, x, y));
      }
    });
  }

  unbindKeys() {
    mousetrap.unbind(opacityLettersKeys);
    mousetrap.unbind(opacityNumberKeys);
    mousetrap.unbind(invertKeys);
    mousetrap.unbind(arrowKeys);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      ...prevState,
      x: nextProps.x,
      y: nextProps.y,
      width: nextProps.width,
      height: nextProps.height
    };
  }

  componentDidMount() {
    setPosition(this.el, this.state.x, this.state.y);

    this.el.addEventListener('mouseover', () => this.bindKeys());
    this.el.addEventListener('mouseout', () => this.unbindKeys());

    interactjs(this.el).draggable({
      onmove: ({ dx, dy, target }) => {
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + dy;

        setPosition(target, x, y);

        this.setState({ x, y });
      }
    });
  }

  render() {
    const { src, remove } = this.props;
    const { opacity, inverted, x, y, width, height } = this.state;
    return (
      <OnionImageWrapper
        innerRef={(el: HTMLDivElement) => {
          this.el = el;
        }}
      >
        <OnionImageElement src={src} opacity={opacity} inverted={inverted} />
        <Coords x={x} y={y} />
        <Size width={width} height={height} />
        <MiniToolbox
          inverted={inverted}
          setInverted={this.setInverted}
          remove={remove}
          x={100}
          y={100}
        />
      </OnionImageWrapper>
    );
  }
}
