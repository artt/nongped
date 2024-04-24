import Box from "@mui/material/Box"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormGroup from "@mui/material/FormGroup"
import Switch from "@mui/material/Switch"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import { Frequency, QuarterlyFrequency } from "types"

type Props = {
  freqList: string[],
  freq: Frequency | QuarterlyFrequency,
  setFreq: (freq: Frequency | QuarterlyFrequency) => void,
  showGrowth: boolean,
  setShowGrowth: (showGrowth: boolean) => void,
  showContribution: boolean,
  setShowContribution: (showContribution: boolean) => void,
}

export default function TimeSeriesController({freqList, freq, setFreq, showGrowth, setShowGrowth, showContribution, setShowContribution}: Props) {

  return (
    <Box
      sx={{
        display: {xs: 'flex', sm: 'block'},
        gap: 2,
        alignItems: 'center',
      }}
    >
      <ToggleButtonGroup
        value={freq}
        size="small"
        exclusive
        onChange={(_e, newFreq: Frequency) => {
          if (newFreq === null) return
          setFreq((newFreq as Frequency))
        }}
        aria-label="frequency"
        fullWidth
        sx={{
          marginBottom: {xs: 0, sm: 2},
        }}
      >
        {freqList.map(freq => (
          <ToggleButton key={freq} value={freq} aria-label={`${freq}ly`}>
            {freq}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <FormGroup>
        <FormControlLabel
          control={<Switch
            checked={showGrowth}
            onChange={() => setShowGrowth(!showGrowth)}
          />}
          label="Growth"
        />
        <FormControlLabel
          control={<Switch
            checked={showContribution}
            onChange={() => setShowContribution(!showContribution)}
          />}
          label="Contribution"
          disabled={!showGrowth}
        />
      </FormGroup>
    </Box>
  )

}
